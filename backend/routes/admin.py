import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId

from backend.database import news_collection, users_collection
from backend.auth import get_current_user
from config import ADMIN_EMAIL

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


# --- Helpers ---
def require_admin(user: dict):
    if user.get("email") != ADMIN_EMAIL and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


def serialize(doc: dict):
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "content": doc.get("content", ""),
        "author_name": doc.get("author_name", "Unknown"),
        "category": doc.get("category", "General"),
        "is_real": doc.get("is_real", True),
        "bert_confidence": doc.get("bert_confidence", 0),
        "fake_prob": doc.get("fake_prob", 0),
        "real_prob": doc.get("real_prob", 0),
        "upvotes": doc.get("upvotes", 0),
        "downvotes": doc.get("downvotes", 0),
        "is_auto_collected": doc.get("is_auto_collected", False),
        "created_at": doc.get("created_at"),
    }


async def safe_db_op(op, not_found_msg):
    try:
        result = await op
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid news ID")
    if getattr(result, "matched_count", getattr(result, "deleted_count", 0)) == 0:
        raise HTTPException(status_code=404, detail=not_found_msg)
    return result


# --- Routes ---
@router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    require_admin(user)

    total = await news_collection.count_documents({})
    real = await news_collection.count_documents({"is_real": True})
    fake = await news_collection.count_documents({"is_real": False})

    return {
        "total_articles": total,
        "real_count": real,
        "fake_count": fake,
        "real_percentage": round(real / total * 100 if total else 0, 1),
        "fake_percentage": round(fake / total * 100 if total else 0, 1),
        "total_users": await users_collection.count_documents({}),
        "auto_collected_count": await news_collection.count_documents({"is_auto_collected": True}),
    }


@router.get("/analytics")
async def get_analytics(user: dict = Depends(get_current_user)):
    require_admin(user)

    category_distribution = [
        {"name": d["_id"] or "Unknown", "value": d["count"]}
        async for d in news_collection.aggregate([
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ])
    ]

    daily_submissions = [
        {"date": d["_id"], "count": d["count"]}
        async for d in news_collection.aggregate([
            {"$match": {"created_at": {"$gte": datetime.now(timezone.utc) - timedelta(days=30)}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "count": {"$sum": 1},
            }},
            {"$sort": {"_id": 1}},
        ])
    ]

    return {
        "category_distribution": category_distribution,
        "daily_submissions": daily_submissions,
        "fake_vs_real": {
            "real": await news_collection.count_documents({"is_real": True}),
            "fake": await news_collection.count_documents({"is_real": False}),
        },
    }


@router.get("/all-news")
async def get_all_news(user: dict = Depends(get_current_user)):
    require_admin(user)
    return [serialize(d) async for d in news_collection.find().sort("created_at", -1)]


@router.get("/rejected")
async def get_rejected(user: dict = Depends(get_current_user)):
    require_admin(user)
    return [serialize(d) async for d in news_collection.find({"is_real": False}).sort("created_at", -1)]


@router.post("/override/{news_id}")
async def override_news(news_id: str, user: dict = Depends(get_current_user)):
    require_admin(user)
    await safe_db_op(
        news_collection.update_one({"_id": ObjectId(news_id)}, {"$set": {"is_real": True}}),
        "Article not found",
    )
    return {"message": "Article overridden to REAL"}


@router.delete("/delete/{news_id}")
async def delete_news(news_id: str, user: dict = Depends(get_current_user)):
    require_admin(user)
    await safe_db_op(
        news_collection.delete_one({"_id": ObjectId(news_id)}),
        "Article not found",
    )
    return {"message": "Article deleted"}