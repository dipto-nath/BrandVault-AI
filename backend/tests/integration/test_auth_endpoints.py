import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import get_db
from app.core.dependencies import get_db_with_org


@pytest.mark.asyncio
async def test_demo_login_endpoint(test_db):
    app.dependency_overrides[get_db] = lambda: test_db
    app.dependency_overrides[get_db_with_org] = lambda: test_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/v1/auth/demo", json={"workspace_slug": "nexatech"})
            assert resp.status_code == 200
            data = resp.json()
            assert "access_token" in data
            assert data["organization"]["slug"] == "nexatech"
            assert data["user"]["role"] == "ADMIN"
            assert data["user"]["email"] == "demo@nexatech.example"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_and_login_flow(test_db):
    app.dependency_overrides[get_db] = lambda: test_db
    app.dependency_overrides[get_db_with_org] = lambda: test_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Register new company
            reg_payload = {
                "company_name": "Lumina Health",
                "workspace_slug": "lumina-health",
                "email": "lead@luminahealth.example",
                "password": "Password12345!",
                "full_name": "Dr. Clara Barton",
                "industry": "Health & Wellness",
            }
            reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
            assert reg_resp.status_code == 200
            reg_data = reg_resp.json()
            assert reg_data["organization"]["slug"] == "lumina-health"
            assert reg_data["user"]["email"] == "lead@luminahealth.example"
            token = reg_data["access_token"]
            refresh_token = reg_data["refresh_token"]

            # Call GET /me with Bearer token
            me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert me_resp.status_code == 200
            me_data = me_resp.json()
            assert me_data["user"]["email"] == "lead@luminahealth.example"
            assert me_data["organization"]["slug"] == "lumina-health"

            # Login with email/password
            login_resp = await client.post(
                "/api/v1/auth/login",
                json={"email": "lead@luminahealth.example", "password": "Password12345!"},
            )
            assert login_resp.status_code == 200
            login_data = login_resp.json()
            assert login_data["access_token"] is not None

            # Refresh token
            ref_resp = await client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": refresh_token},
            )
            assert ref_resp.status_code == 200
            ref_data = ref_resp.json()
            assert ref_data["access_token"] is not None
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_demo_mutation_guard(test_db):
    app.dependency_overrides[get_db] = lambda: test_db
    app.dependency_overrides[get_db_with_org] = lambda: test_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            demo_resp = await client.post("/api/v1/auth/demo", json={"workspace_slug": "nexatech"})
            assert demo_resp.status_code == 200
            token = demo_resp.json()["access_token"]

            # Try to modify demo workspace member role -> must return 403 Forbidden
            patch_resp = await client.patch(
                "/api/v1/workspaces/current/members/22222222-2222-2222-2222-222222222222",
                headers={"Authorization": f"Bearer {token}"},
                json={"role": "AGENCY"},
            )
            assert patch_resp.status_code == 403
            assert "demo workspace" in patch_resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()
