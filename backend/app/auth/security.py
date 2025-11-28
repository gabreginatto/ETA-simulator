"""
Authentication security module for SludgeSim.
Provides a stub implementation that can be replaced with real auth later.
"""
from typing import Optional
from dataclasses import dataclass
from fastapi import Depends, HTTPException, Header, status

from app.config import settings


@dataclass
class User:
    """Represents an authenticated user."""
    user_id: str
    email: str
    tenant_id: Optional[str] = None


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> User:
    """
    Dependency to get the current authenticated user.

    This is a stub implementation that:
    - Returns an anonymous user if auth is disabled
    - Validates a static token if auth is enabled

    In production, replace with proper JWT/OAuth validation.

    Args:
        authorization: The Authorization header value (Bearer token)

    Returns:
        User object with user_id, email, and optional tenant_id

    Raises:
        HTTPException: If auth is enabled and token is invalid/missing
    """
    # If auth is disabled, return anonymous user
    if not settings.auth_enabled:
        return User(
            user_id="anonymous",
            email="anonymous@local",
            tenant_id=None,
        )

    # Auth is enabled - validate token
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check Bearer token format
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Use 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization[7:]  # Remove "Bearer " prefix

    # Validate against configured token
    if not settings.auth_token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Auth is enabled but AUTH_TOKEN is not configured",
        )

    if token != settings.auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Token is valid - return authenticated user
    return User(
        user_id="authenticated",
        email="user@example.com",
        tenant_id="default",
    )


def require_auth(user: User = Depends(get_current_user)) -> User:
    """
    Dependency that requires authentication.
    Use this to protect routes that need a logged-in user.
    """
    return user
