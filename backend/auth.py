"""
backend/auth.py — Authentication utilities.
Handles password hashing (bcrypt), JWT creation/verification,
token blacklisting for logout, and FastAPI auth dependencies.
"""
import logging
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from backend.database import users_collection
from bson import ObjectId

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# In-memory token blacklist — stores revoked JWTs until server restart.
# LIMITATION: This set is per-process. With multiple workers (e.g. Gunicorn),
# each worker has its own blacklist, so a token revoked in one worker may
# still be accepted by another. For production with multiple workers,
# replace with a shared store like Redis.
_blacklisted_tokens: set[str] = set()


# ─── Password Helpers ─────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Check a plain-text password against its bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ─── JWT Helpers ──────────────────────────────────────────

def create_access_token(data: dict) -> str:
    """Create a signed JWT access token with an expiry timestamp."""
    to_encode = data.copy()
    to_encode["exp"] = (
        datetime.now(timezone.utc)
        + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def blacklist_token(token: str) -> None:
    """Add a token to the in-memory blacklist (used on logout)."""
    _blacklisted_tokens.add(token)


def verify_token(token: str) -> str:
    """
    Decode and validate a JWT token.
    Raises HTTP 401 if invalid, expired, or blacklisted.
    Returns the user_id (subject claim).
    """
    if token in _blacklisted_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please log in again.",
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject.",
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )


# ─── FastAPI Dependencies ─────────────────────────────────

async def get_current_user(
    token: str = Depends(oauth2_scheme),
) -> dict:
    """FastAPI dependency — extract and validate the current user."""
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    user_id = verify_token(token)
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    user["id"] = str(user["_id"])
    return user
