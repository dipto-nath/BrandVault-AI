from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    role: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    is_demo: bool = False
    plan: str = "TRIAL"
    onboarding_state: Optional[str] = "PENDING"
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse
    organization: OrganizationResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class DemoLoginRequest(BaseModel):
    workspace_slug: str = "nexatech"


class RegisterRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=200)
    workspace_slug: Optional[str] = Field(None, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = "REVIEWER"


class AcceptInviteRequest(BaseModel):
    token: str
    full_name: str
    password: str = Field(..., min_length=8)
