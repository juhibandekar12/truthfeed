import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId

from backend.database import news_collection, users_collection
from backend.auth import get_current_user
from backend.models import NewsPostRequest, NewsPostResult
from ai.predict import predict
from services.fact_checker import cross_reference_news

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/news", tags=["News"])


# --- Helpers ---
def serialize(doc):
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "content": doc["content"],
        "author_id": doc.get("author_id", ""),
        "author_name": doc.get("author_name", "Anonymous"),
        "category": doc.get("category", "General"),
        "is_real": doc.get("is_real", True),
        "bert_confidence": doc.get("bert_confidence", 0),
        "fake_prob": doc.get("fake_prob", 0),
        "real_prob": doc.get("real_prob", 0),
        "upvotes": doc.get("upvotes", 0),
        "downvotes": doc.get("downvotes", 0),
        "is_auto_collected": doc.get("is_auto_collected", False),
        "created_at": doc.get("created_at", datetime.now(timezone.utc)),
    }


def build_doc(req, user, pred, is_real, conf):
    return {
        "title": req.title,
        "content": req.content,
        "author_id": str(user["_id"]),
        "author_name": user["username"],
        "category": req.category,
        "is_real": is_real,
        "bert_confidence": conf,
        "fake_prob": pred["fake_prob"],
        "real_prob": pred["real_prob"],
        "upvotes": 0,
        "downvotes": 0,
        "is_auto_collected": False,
        "created_at": datetime.now(timezone.utc),
    }


async def process(req, user):
    text = f"{req.title} {req.content}"
    pred = predict(text)

    is_real, conf = pred["is_real"], pred["confidence"]

    # fact check boost
    if is_real and cross_reference_news(req.title).get("is_verified"):
        conf = max(conf, 85.0)

    doc = build_doc(req, user, pred, is_real, conf)
    result = await news_collection.insert_one(doc)

    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$inc": {"trust_score": 1 if is_real else -10}},
    )

    return {
        "status": "approved" if is_real else "fake",
        "message": "REAL NEWS" if is_real else "FAKE NEWS",
        "is_real": is_real,
        "confidence": conf,
        "real_prob": pred["real_prob"],
        "fake_prob": pred["fake_prob"],
        **({"news_id": str(result.inserted_id)} if is_real else {}),
    }


# --- Routes ---
@router.post("/post", response_model=NewsPostResult)
async def post_news(req: NewsPostRequest, user=Depends(get_current_user)):
    return await process(req, user)


@router.get("/feed")
async def get_feed(page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=50)):
    skip = (page - 1) * limit
    cursor = news_collection.find({"is_real": True}).sort("created_at", -1).skip(skip).limit(limit)

    articles = [serialize(d) async for d in cursor]
    total = await news_collection.count_documents({"is_real": True})

    return {
        "articles": articles,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


def simple_feed(sort_field):
    return news_collection.find({"is_real": True}).sort(sort_field, -1).limit(10)


@router.get("/trending")
async def trending():
    return [serialize(d) async for d in simple_feed("upvotes")]


@router.get("/breaking")
async def breaking():
    return [serialize(d) async for d in simple_feed("created_at")]


@router.get("/search")
async def search(query: str = Query(..., min_length=1)):
    cursor = news_collection.find({"$text": {"$search": query}, "is_real": True}).sort("created_at", -1).limit(20)
    return [serialize(d) async for d in cursor]


@router.get("/my-posts")
async def my_posts(user=Depends(get_current_user)):
    cursor = news_collection.find({"author_id": str(user["_id"])}).sort("created_at", -1)
    return [serialize(d) async for d in cursor]


@router.get("/category/{category}")
async def by_category(category: str):
    cursor = news_collection.find({"category": category, "is_real": True}).sort("created_at", -1).limit(20)
    return [serialize(d) async for d in cursor]


def get_doc(news_id: str):
    try: return ObjectId(news_id)
    except: raise HTTPException(400, "Invalid news ID format")


@router.get("/{news_id}")
async def detail(news_id: str):
    doc = await news_collection.find_one({"_id": get_doc(news_id)})
    if not doc: raise HTTPException(404, "Article not found")
    return serialize(doc)


@router.delete("/{news_id}")
async def delete(news_id: str, user=Depends(get_current_user)):
    oid = get_doc(news_id)
    doc = await news_collection.find_one({"_id": oid})
    if not doc: raise HTTPException(404, "Article not found")

    if doc.get("author_id") != str(user["_id"]) and user.get("role") != "admin":
        raise HTTPException(403, "Not authorized")

    await news_collection.delete_one({"_id": oid})
    return {"status": "success", "message": "Article deleted successfully"}