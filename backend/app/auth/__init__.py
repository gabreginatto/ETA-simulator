"""
Authentication module for SludgeSim.
"""
from app.auth.security import get_current_user, User

__all__ = ["get_current_user", "User"]
