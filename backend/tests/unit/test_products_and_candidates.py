import pytest
from uuid import UUID
from decimal import Decimal
from fastapi import HTTPException

from app.models.product import ProductStatus
from app.models.fact_candidate import CandidateStatus
from app.models.fact import FactVerificationStatus
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.fact_candidate import (
    FactCandidateCreate,
    FactCandidateUpdate,
    ApproveCandidateRequest,
)
from app.schemas.fact import ApprovedFactCreate
from app.services.products import ProductService
from app.services.facts import FactService
from app.services.auth import AuthService
from app.schemas.auth import RegisterRequest


from uuid import UUID, uuid4

@pytest.fixture
async def setup_org(test_db):
    auth_service = AuthService(test_db)
    unique_id = uuid4().hex[:6]
    req = RegisterRequest(
        company_name=f"AeroDynamics {unique_id}",
        email=f"eng_{unique_id}@aerodynamics.example",
        password="AeroPassword123!",
        full_name="Marcus Vance",
        industry="Consumer Tech & Hardware",
    )
    resp = await auth_service.register_company(req)
    return resp.organization.id, resp.user.id


@pytest.mark.asyncio
async def test_product_crud(test_db, setup_org):
    org_id, user_id = setup_org
    product_service = ProductService(test_db)

    # 1. Create product
    create_req = ProductCreate(
        name="AeroDrone X1",
        category="UAV",
        model_or_version="v1.2",
        description="Next-generation autonomous inspection drone",
    )
    prod = await product_service.create_product(org_id, user_id, create_req)
    assert prod.id is not None
    assert prod.name == "AeroDrone X1"
    assert prod.status == ProductStatus.ACTIVE

    # Duplicate name check
    with pytest.raises(HTTPException) as exc_info:
        await product_service.create_product(org_id, user_id, create_req)
    assert exc_info.value.status_code == 400

    # 2. List products
    products = await product_service.list_products(org_id)
    assert len(products) >= 1
    drone = next(p for p in products if p.name == "AeroDrone X1")
    assert drone.facts_count == 0

    # 3. Update product
    update_req = ProductUpdate(model_or_version="v1.3", description="Updated description")
    updated = await product_service.update_product(org_id, user_id, prod.id, update_req)
    assert updated.model_or_version == "v1.3"
    assert updated.description == "Updated description"

    # 4. Delete product
    await product_service.delete_product(org_id, user_id, prod.id)
    with pytest.raises(HTTPException) as exc_info:
        await product_service.get_product(org_id, prod.id)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_fact_candidate_lifecycle(test_db, setup_org):
    org_id, user_id = setup_org
    product_service = ProductService(test_db)
    fact_service = FactService(test_db)

    # Create a product
    prod = await product_service.create_product(
        org_id,
        user_id,
        ProductCreate(name="Titan Watch", category="Wearables"),
    )

    # 1. Create candidate (extracted by ingestion pipeline)
    cand_data = FactCandidateCreate(
        product_id=prod.id,
        entity="Titan Watch",
        attribute="Water Resistance",
        value_text="50 meters",
        value_numeric=Decimal("50.0"),
        unit="m",
        qualifier="ISO 22810 standard",
        source_page=4,
        excerpt="The Titan Watch is water resistant up to 50 meters under ISO 22810.",
        confidence=0.95,
    )
    cand = await fact_service.create_candidate(org_id, cand_data)
    assert cand.id is not None
    assert cand.status == CandidateStatus.PENDING

    # 2. List candidates
    cands = await fact_service.list_candidates(org_id, product_id=prod.id)
    assert len(cands) == 1
    assert cands[0].entity == "Titan Watch"

    # 3. Edit candidate before approval
    edit_req = FactCandidateUpdate(qualifier="ISO 22810 certified laboratory tested")
    edited_cand = await fact_service.update_candidate(org_id, cand.id, edit_req)
    assert edited_cand.status == CandidateStatus.EDITED
    assert edited_cand.qualifier == "ISO 22810 certified laboratory tested"

    # 4. Approve candidate into active ApprovedFact
    approve_req = ApproveCandidateRequest(
        fact_code="FACT-TITAN-WATER",
        title="Titan Watch Water Resistance Depth",
    )
    fact = await fact_service.approve_candidate(org_id, user_id, cand.id, approve_req)
    assert fact.id is not None
    assert fact.fact_code == "FACT-TITAN-WATER"
    assert fact.product_id == prod.id
    assert fact.verification_status == FactVerificationStatus.APPROVED

    # Re-check candidate status
    updated_cands = await fact_service.list_candidates(org_id, status_filter=CandidateStatus.APPROVED)
    assert any(c.id == cand.id for c in updated_cands)

    # Product fact count should now be 1
    prod_details = await product_service.get_product(org_id, prod.id)
    assert prod_details.facts_count == 1


@pytest.mark.asyncio
async def test_fact_candidate_rejection(test_db, setup_org):
    org_id, user_id = setup_org
    fact_service = FactService(test_db)

    cand_data = FactCandidateCreate(
        entity="Sensor",
        attribute="Operating Temp",
        value_text="-40C to 85C",
        excerpt="Operating range is -40C to 85C.",
    )
    cand = await fact_service.create_candidate(org_id, cand_data)

    rejected = await fact_service.reject_candidate(org_id, user_id, cand.id)
    assert rejected.status == CandidateStatus.REJECTED
    assert rejected.reviewed_by == user_id
