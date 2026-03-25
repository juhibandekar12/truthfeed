import motor.motor_asyncio
from config import MONGODB_URL, MONGODB_DB

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client[MONGODB_DB]

# Collection references
users_collection = db["users"]
news_collection = db["news"]
comments_collection = db["comments"]
bookmarks_collection = db["bookmarks"]
votes_collection = db["votes"]


async def setup_indexes():
    """Create indexes for performance and uniqueness constraints."""
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("username", unique=True)
    await news_collection.create_index("created_at")
    await news_collection.create_index("author_id")
    await news_collection.create_index("category")
    await news_collection.create_index("is_real")
    await news_collection.create_index([("title", "text"), ("content", "text")])
    await comments_collection.create_index("news_id")
    await bookmarks_collection.create_index([("user_id", 1), ("news_id", 1)], unique=True)
    await votes_collection.create_index([("user_id", 1), ("news_id", 1)], unique=True)
