import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId

from backend.database import (
    news_collection, votes_collection,
    bookmarks_collection, comments_collection,
)
from backend.auth import get_current_user
from backend.models import (
    CommentRequest, VoteResponse, BookmarkResponse, CommentResponse,
)
from ai.toxicity import check_toxicity
from ai.predict import predict
from config import DOWNVOTE_RECHECK_THRESHOLD

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/engagement", tags=["Engagement"])


# --- Helpers ---
def obj(news_id: str):
    try: return ObjectId(news_id)
    except: raise HTTPException(400, "Invalid news ID")


async def get_article(news_id: str):
    article = await news_collection.find_one({"_id": obj(news_id)})
    if not article: raise HTTPException(404, "Article not found")
    return article


def vote_response(msg, up, down):
    return {"message": msg, "upvotes": up, "downvotes": down}


# --- Voting ---
async def handle_vote(news_id: str, vote_type: str, user: dict):
    opposite = "downvote" if vote_type == "upvote" else "upvote"
    oid, uid = obj(news_id), str(user["_id"])
    article = await get_article(news_id)

    existing = await votes_collection.find_one({"user_id": uid, "news_id": news_id})
    up, down = article["upvotes"], article["downvotes"]

    if existing:
        if existing["vote_type"] == vote_type:
            await votes_collection.delete_one({"_id": existing["_id"]})
            await news_collection.update_one({"_id": oid}, {"$inc": {f"{vote_type}s": -1}})
            return vote_response(f"{vote_type.title()} removed",
                                 up - (vote_type=="upvote"),
                                 down - (vote_type=="downvote"))

        await votes_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"vote_type": vote_type, "created_at": datetime.now(timezone.utc)}},
        )
        await news_collection.update_one(
            {"_id": oid},
            {"$inc": {f"{vote_type}s": 1, f"{opposite}s": -1}},
        )
        return vote_response(f"Changed to {vote_type}",
                             up + (vote_type=="upvote") - (vote_type=="downvote"),
                             down + (vote_type=="downvote") - (vote_type=="upvote"))

    await votes_collection.insert_one({
        "user_id": uid, "news_id": news_id,
        "vote_type": vote_type, "created_at": datetime.now(timezone.utc),
    })
    await news_collection.update_one({"_id": oid}, {"$inc": {f"{vote_type}s": 1}})
    return vote_response(f"{vote_type.title()}d",
                         up + (vote_type=="upvote"),
                         down + (vote_type=="downvote"))


@router.post("/{news_id}/upvote", response_model=VoteResponse)
async def upvote(news_id: str, user: dict = Depends(get_current_user)):
    return await handle_vote(news_id, "upvote", user)


@router.post("/{news_id}/downvote", response_model=VoteResponse)
async def downvote(news_id: str, user: dict = Depends(get_current_user)):
    result = await handle_vote(news_id, "downvote", user)

    if result["downvotes"] >= DOWNVOTE_RECHECK_THRESHOLD:
        article = await get_article(news_id)
        if article.get("is_real", True):
            pred = predict(f"{article['title']} {article['content']}")
            if not pred["is_real"]:
                await news_collection.update_one(
                    {"_id": obj(news_id)},
                    {"$set": {
                        "is_real": False,
                        "bert_confidence": pred["confidence"],
                        "fake_prob": pred["fake_prob"],
                        "real_prob": pred["real_prob"],
                    }},
                )
                result["message"] = "Article rechecked and marked fake"
    return result


# --- Bookmark ---
@router.post("/{news_id}/bookmark", response_model=BookmarkResponse)
async def toggle_bookmark(news_id: str, user: dict = Depends(get_current_user)):
    uid = str(user["_id"])
    existing = await bookmarks_collection.find_one({"user_id": uid, "news_id": news_id})

    if existing:
        await bookmarks_collection.delete_one({"_id": existing["_id"]})
        return {"message": "Bookmark removed", "bookmarked": False}

    await bookmarks_collection.insert_one({
        "user_id": uid, "news_id": news_id,
        "created_at": datetime.now(timezone.utc),
    })
    return {"message": "Bookmarked", "bookmarked": True}


@router.get("/{news_id}/bookmark-status")
async def get_bookmark_status(news_id: str, user: dict = Depends(get_current_user)):
    uid = str(user["_id"])
    exists = await bookmarks_collection.find_one({"user_id": uid, "news_id": news_id})
    return {"bookmarked": bool(exists)}


@router.get("/bookmarks/me")
async def get_my_bookmarks(user: dict = Depends(get_current_user)):
    uid = str(user["_id"])
    cursor = bookmarks_collection.find({"user_id": uid}).sort("created_at", -1)

    res = []
    async for bm in cursor:
        try:
            a = await news_collection.find_one({"_id": ObjectId(bm["news_id"])})
            if a:
                res.append({
                    "id": str(a["_id"]),
                    "title": a["title"],
                    "content": a["content"],
                    "author_name": a.get("author_name", "Anonymous"),
                    "category": a.get("category", "General"),
                    "is_real": a.get("is_real", True),
                    "bert_confidence": a.get("bert_confidence", 0),
                    "fake_prob": a.get("fake_prob", 0),
                    "real_prob": a.get("real_prob", 0),
                    "upvotes": a.get("upvotes", 0),
                    "downvotes": a.get("downvotes", 0),
                    "created_at": a.get("created_at"),
                })
        except: continue
    return res


# --- Comments ---
@router.post("/{news_id}/comment", response_model=CommentResponse)
async def add_comment(news_id: str, req: CommentRequest, user: dict = Depends(get_current_user)):
    tox = check_toxicity(req.content)
    if tox["is_toxic"]:
        raise HTTPException(400, tox["message"])

    await get_article(news_id)

    doc = {
        "news_id": news_id,
        "author_id": str(user["_id"]),
        "author_name": user["username"],
        "content": req.content,
        "created_at": datetime.now(timezone.utc),
    }
    res = await comments_collection.insert_one(doc)

    return {**doc, "id": str(res.inserted_id)}


@router.get("/{news_id}/comments")
async def get_comments(news_id: str):
    cursor = comments_collection.find({"news_id": news_id}).sort("created_at", -1)
    return [
        {**doc, "id": str(doc["_id"])}
        async for doc in cursor
    ]