# config.py — Unified configuration for the entire TruthFeed project.
# All settings are read from environment variables (.env file locally, Secrets on HuggingFace).
import os
import sys
from dotenv import load_dotenv

load_dotenv(".env")

# ─── MongoDB ────────────────────────────────────────────────
MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB = os.getenv("MONGODB_DB", "truthfeed")

# ─── BERT Model ─────────────────────────────────────────────
MODEL_SOURCE = os.getenv("MODEL_SOURCE", "huggingface")
HUGGINGFACE_MODEL_PATH = os.getenv("HUGGINGFACE_MODEL_PATH", "avivaaaaa123/fake-news-detector")
LOCAL_MODEL_PATH = "./bert_model"
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "128"))

# ─── JWT ────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# ─── NewsAPI ────────────────────────────────────────────────
NEWS_API_KEY = os.getenv("NEWS_API_KEY")  # Optional — disables auto-fetch if absent

# ─── App ────────────────────────────────────────────────────
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
DOWNVOTE_RECHECK_THRESHOLD = int(os.getenv("DOWNVOTE_RECHECK_THRESHOLD", "10"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# ─── Admin ──────────────────────────────────────────────────
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

# ─── Streamlit App Settings ─────────────────────────────────
APP_TITLE = "Fake News Detector"
APP_ICON = "📰"
APP_DESCRIPTION = "Powered by BERT — Enter a news article to check if it's real or fake."


def validate_config() -> None:
    """
    Validate that all required environment variables are set.
    Exits immediately with a clear error message if any are missing.
    Call this at server startup in backend/main.py.
    """
    required = {
        "MONGODB_URL": MONGODB_URL,
        "SECRET_KEY": SECRET_KEY,
    }
    missing = [key for key, val in required.items() if not val]
    if missing:
        print(f"[Config] FATAL: Missing required environment variables: {', '.join(missing)}")
        print("[Config] Set them in .env (local) or HuggingFace Space Secrets (production).")
        sys.exit(1)