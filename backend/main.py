import sys
import os
import logging

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from config import FRONTEND_URL, ENVIRONMENT, validate_config
from backend.database import setup_indexes
from ai.model import load_model
from services.scheduler import start_scheduler, stop_scheduler
from backend.routes import users, news, engagement, admin

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Validate required env vars immediately — exits with clear error if missing
    validate_config()
    # Startup
    logger.info("Starting TruthFeed backend...")
    load_model()
    await setup_indexes()
    start_scheduler()
    logger.info("TruthFeed backend ready.")
    yield
    # Shutdown
    stop_scheduler()
    logger.info("TruthFeed backend stopped.")


app = FastAPI(
    title="TruthFeed API",
    description="AI-powered Fake News Detection Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if FRONTEND_URL and FRONTEND_URL not in origins:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Route Registration ──────────────────────────────────
app.include_router(users.router)     # /auth
app.include_router(news.router)      # /news
app.include_router(engagement.router)  # /engagement
app.include_router(admin.router)     # /admin


@app.get("/")
async def root():
    """Serve frontend index.html in production, or API info in dev."""
    frontend_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "frontend", "dist",
    )
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "name": "TruthFeed API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# ─── Static Files & SPA Fallback ─────────────────────────
frontend_dist = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend", "dist",
)
if os.path.isdir(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount(
            "/assets", StaticFiles(directory=assets_dir), name="assets"
        )

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        """Serve index.html for all unmatched routes (React Router)."""
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"error": "Frontend not built"}
