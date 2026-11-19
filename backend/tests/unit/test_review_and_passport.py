import pytest
from uuid import uuid4
import hashlib
from app.services.auth import AuthService
from app.schemas.auth import RegisterRequest
from app.services.passport import PassportService
from app.models.content import ContentItem, ContentStatus, ContentType, Channel, RiskLevel
from app.models.analysis import AnalysisRun, AnalysisStatus, Claim, VerificationStatus
from app.models.finding import Finding, FindingType, Severity
from app.models.review import ReviewDecision, ReviewDecisionType

@pytest.fixture
async def setup_org(test_db):
    auth_service = AuthService(test_db)
    unique_id = uuid4().hex[:6]
    req = RegisterRequest(
        company_name=f"PassportCorp {unique_id}",
        email=f"reviewer_{unique_id}@passportcorp.example",
        password="PassPassword123!",
        full_name="Elena Rostova",
        industry="Consumer Tech & Hardware",
    )
    resp = await auth_service.register_company(req)
    return resp.organization.id, resp.user.id

@pytest.mark.asyncio
async def test_passport_generation(test_db, setup_org):
    org_id, user_id = setup_org
    passport_service = PassportService(test_db)

    # 1. Create content item
    content_text = "The NeoPad Pro has up to 18 hours battery life."
    content_hash = hashlib.sha256(content_text.encode()).hexdigest()
    content = ContentItem(
        org_id=org_id,
        title="NeoPad Pro Launch Copy",
        content_type=ContentType.WEBSITE_COPY,
        channel=Channel.WEBSITE,
        original_content=content_text,
        current_content=content_text,
        content_hash=content_hash,
        status=ContentStatus.APPROVED,
        created_by=user_id,
    )
    test_db.add(content)
    await test_db.flush()

    # 2. Add analysis run
    run = AnalysisRun(
        org_id=org_id,
        content_id=content.id,
        provider="mock",
        model_name="mock-model",
        prompt_version="v1.0",
        status=AnalysisStatus.COMPLETED,
    )
    test_db.add(run)
    await test_db.flush()

    # 3. Add an approved claim
    claim = Claim(
        org_id=org_id,
        content_id=content.id,
        analysis_run_id=run.id,
        claim_text="18 hours battery life",
        claim_type="PRODUCT_SPEC",
        verification_status=VerificationStatus.SUPPORTED,
        confidence=0.95,
        explanation="Matches approved engineering lab spec sheet",
    )
    test_db.add(claim)

    # 4. Add a decision
    decision = ReviewDecision(
        org_id=org_id,
        content_id=content.id,
        reviewer_id=user_id,
        decision=ReviewDecisionType.APPROVED,
        comment="Verified against hardware spec. Approved.",
    )
    test_db.add(decision)
    await test_db.commit()

    # 5. Generate passport
    passport = await passport_service.generate_passport(
        content_id=content.id,
        org_id=org_id,
    )

    assert passport.passport_id == f"PASS-{content.id}"
    assert passport.content_hash == content_hash
    assert len(passport.claims) == 1
    assert passport.claims[0].verification_status == VerificationStatus.SUPPORTED
    assert len(passport.decisions) == 1
    assert passport.decisions[0]["decision"] == ReviewDecisionType.APPROVED
