import pytest
from uuid import UUID
from fastapi import HTTPException
from app.services.auth import AuthService
from app.schemas.auth import RegisterRequest
from app.core.security import verify_password, has_permission, require_role, UserContext


@pytest.mark.asyncio
async def test_register_company_creates_org_and_admin(test_db):
    auth_service = AuthService(test_db)
    req = RegisterRequest(
        company_name="Apex Global",
        email="founder@apexglobal.example",
        password="securePassword123!",
        full_name="Alex Rivera",
        industry="B2B SaaS & Enterprise Software",
    )

    token_resp = await auth_service.register_company(req)
    assert token_resp.access_token is not None
    assert token_resp.refresh_token is not None
    assert token_resp.user.email == "founder@apexglobal.example"
    assert token_resp.user.full_name == "Alex Rivera"
    assert token_resp.organization.name == "Apex Global"
    assert token_resp.organization.slug == "apex-global"
    assert token_resp.user.role == "ADMIN"


@pytest.mark.asyncio
async def test_login_success_and_failure(test_db):
    auth_service = AuthService(test_db)
    req = RegisterRequest(
        company_name="Nova Labs",
        email="scientist@novalabs.example",
        password="strongPassword456!",
        full_name="Elena Rostova",
        industry="Health & Wellness",
    )
    await auth_service.register_company(req)

    # Correct credentials
    login_resp = await auth_service.login("scientist@novalabs.example", "strongPassword456!")
    assert login_resp.access_token is not None
    assert login_resp.user.email == "scientist@novalabs.example"

    # Wrong password raises 401
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.login("scientist@novalabs.example", "wrongPassword")
    assert exc_info.value.status_code == 401

    # Nonexistent user raises 401
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.login("nobody@novalabs.example", "somePassword")
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_rotation(test_db):
    auth_service = AuthService(test_db)
    req = RegisterRequest(
        company_name="Orbit Media",
        email="orbit@orbitmedia.example",
        password="myPassword789!",
        full_name="Sam Orbit",
    )
    resp = await auth_service.register_company(req)
    initial_refresh = resp.refresh_token

    # Rotate refresh token
    new_resp = await auth_service.refresh_tokens(initial_refresh)
    assert new_resp.access_token is not None
    assert new_resp.refresh_token != initial_refresh

    # Old refresh token should now be rejected
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.refresh_tokens(initial_refresh)
    assert exc_info.value.status_code == 401


def test_role_hierarchy_permissions():
    admin = UserContext(user_id=UUID(int=1), org_id=UUID(int=1), role="ADMIN", email="admin@test.com")
    reviewer = UserContext(user_id=UUID(int=2), org_id=UUID(int=1), role="REVIEWER", email="rev@test.com")
    creator = UserContext(user_id=UUID(int=3), org_id=UUID(int=1), role="CREATOR", email="creator@test.com")

    assert has_permission("ADMIN", ["REVIEWER"]) is True
    assert has_permission("ADMIN", ["CREATOR"]) is True
    assert has_permission("REVIEWER", ["CREATOR"]) is True
    assert has_permission("CREATOR", ["REVIEWER"]) is False
    assert has_permission("CREATOR", ["ADMIN"]) is False

    # require_role raises HTTPException if unauthorized
    require_role(admin, ["ADMIN"])
    require_role(admin, ["REVIEWER"])
    require_role(reviewer, ["REVIEWER"])

    with pytest.raises(HTTPException) as exc_info:
        require_role(creator, ["REVIEWER"])
    assert exc_info.value.status_code == 403
