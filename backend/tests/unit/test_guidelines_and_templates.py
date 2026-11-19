import pytest
from uuid import uuid4
from app.services.auth import AuthService
from app.schemas.auth import RegisterRequest
from app.services.guidelines import GuidelineService
from app.schemas.guideline_template import GuidelineCandidateCreate
from app.models.guideline_candidate import CandidateStatus
from app.models.guideline import GuidelineCategory, Severity

@pytest.fixture
async def setup_org(test_db):
    auth_service = AuthService(test_db)
    unique_id = uuid4().hex[:6]
    req = RegisterRequest(
        company_name=f"RuleCorp {unique_id}",
        email=f"compliance_{unique_id}@rulecorp.example",
        password="RulePassword123!",
        full_name="Sarah Connor",
        industry="B2B SaaS & Enterprise Software",
    )
    resp = await auth_service.register_company(req)
    return resp.organization.id, resp.user.id

@pytest.mark.asyncio
async def test_guideline_templates_and_cloning(test_db, setup_org):
    org_id, user_id = setup_org
    service = GuidelineService(test_db)

    # 1. List templates
    templates = await service.list_templates(industry="B2B SaaS & Enterprise Software")
    assert len(templates) > 0
    first_template = templates[0]
    assert first_template.rule_code is not None

    # 2. Clone templates into workspace
    cloned = await service.clone_templates(
        org_id=org_id,
        user_id=user_id,
        template_ids=[first_template.id],
    )
    assert len(cloned) == 1
    assert cloned[0].rule_code == first_template.rule_code

    # 3. Verify workspace now has cloned guideline
    workspace_guidelines = await service.list_guidelines(org_id=org_id)
    assert len(workspace_guidelines) >= 1
    assert any(g.rule_code == first_template.rule_code for g in workspace_guidelines)

@pytest.mark.asyncio
async def test_guideline_candidate_workflow(test_db, setup_org):
    org_id, user_id = setup_org
    service = GuidelineService(test_db)

    # 1. Create a guideline candidate
    candidate_in = GuidelineCandidateCreate(
        title="No Absolutes in Performance Claims",
        category=GuidelineCategory.TONE,
        description="Never state 100% uptime without SLA qualification.",
        rule_code="RULE-TONE-SLA",
        severity=Severity.HIGH,
        examples={
            "good": ["Guaranteed 99.9% uptime backed by standard SLA."],
            "bad": ["We have 100% uptime and never go down."],
        },
    )
    candidate = await service.create_candidate(org_id=org_id, data=candidate_in)
    assert candidate.id is not None
    assert candidate.status == CandidateStatus.PENDING

    # 2. List candidates
    candidates = await service.list_candidates(org_id=org_id, status_filter=CandidateStatus.PENDING)
    assert len(candidates) >= 1

    # 3. Approve candidate -> creates real guideline
    approved_guideline = await service.approve_candidate(
        org_id=org_id,
        user_id=user_id,
        candidate_id=candidate.id,
    )
    assert approved_guideline.rule_code == "RULE-TONE-SLA"
    assert approved_guideline.org_id == org_id

    # 4. Verify candidate status updated
    updated_candidate = await service.get_candidate(org_id=org_id, candidate_id=candidate.id)
    assert updated_candidate.status == CandidateStatus.APPROVED
    assert updated_candidate.reviewed_by == user_id
