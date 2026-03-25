"""
backend/routes/users.py — Authentication endpoints.
Handles user signup, login (JWT), logout (token blacklisting), and profile retrieval.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from backend.database import users_collection
from backend.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, blacklist_token,
)
from backend.models import SignupRequest, LoginRequest, TokenResponse, UserResponse
from config import ADMIN_EMAIL

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest):
    """Register a new user account and return a JWT access token."""
    if await users_collection.find_one({"email": request.email}):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if await users_collection.find_one({"username": request.username}):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    role = "admin" if request.email == ADMIN_EMAIL else "user"
    result = await users_collection.insert_one({
        "username": request.username,
        "email": request.email,
        "password": hash_password(request.password),
        "role": role,
        "trust_score": 0,
        "created_at": datetime.now(timezone.utc),
    })
    return {"access_token": create_access_token({"sub": str(result.inserted_id)}), "token_type": "bearer"}


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate with email + password and return a JWT access token."""
    user = await users_collection.find_one({"email": request.email})
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return {"access_token": create_access_token({"sub": str(user["_id"])}), "token_type": "bearer"}


@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    """Invalidate the current JWT token (server-side blacklist)."""
    if token:
        blacklist_token(token)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"],
        "trust_score": current_user.get("trust_score", 0),
        "created_at": current_user["created_at"],
    }
