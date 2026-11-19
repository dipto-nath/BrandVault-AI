from datetime import datetime, timedelta, timezone
from typing import Optional, List
from uuid import UUID
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel
import structlog

from app.core.config import settings

logger = structlog.get_logger()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenPayload(BaseModel):
    sub: str  # user_id
    org_id: str
    role: str
    email: str
    exp: int


class UserContext(BaseModel):
    user_id: UUID
    org_id: UUID
    role: str
    email: str
    full_name: Optional[str] = None


def create_access_token(
    data: dict, expires_delta: Optional[timedelta] = None
) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_EXPIRE_MINUTES
        )
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return TokenPayload(**payload)
    except JWTError as e:
        logger.warning("token_verification_failed", error=str(e))
        raise ValueError("Invalid token")


import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8")[:72],
        bcrypt.gensalt(),
    ).decode("utf-8")


# Role hierarchy for permission checks
ROLE_HIERARCHY = {
    "ADMIN": 4,
    "MANAGER": 3,
    "REVIEWER": 2,
    "CREATOR": 1,
    "AGENCY": 1,
}


def has_permission(user_role: str, required_roles: List[str]) -> bool:
    user_level = ROLE_HIERARCHY.get(user_role, 0)
    required_level = max(ROLE_HIERARCHY.get(r, 0) for r in required_roles)
    return user_level >= required_level


from fastapi import HTTPException, status

def require_role(user: UserContext, allowed_roles: List[str]) -> None:
    if not has_permission(user.role, allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role {user.role} not authorized. Required: {allowed_roles}",
        )