import pytest
from uuid import uuid4
from datetime import datetime, timezone
from app.services.auth import AuthService
from app.schemas.auth import RegisterRequest, UpdateMemberRoleRequest, InviteMemberRequest
from app.models.organization import User, WorkspaceMember, WorkspaceRole, Invitation
from app.models.content import ContentItem, ContentStatus, ContentType, Channel
from app.models.analysis import AnalysisRun, AnalysisStatus
from app.models.finding import Finding, FindingType, Severity
from app.models.review import FindingFeedback, FeedbackType

@pytest.fixture
async def setup_org(test_db):
    auth_service = AuthService(test_db)
    unique_id = uuid4().hex[:6]
    req = RegisterRequest(
        company_name=f"GovCorp {unique_id}",
        email=f"admin_{unique_id}@govcorp.example",
        password="GovPassword123!",
        full_name="Gregory House",
        industry="Health & Wellness",
    )
    resp = await auth_service.register_company(req)
    return resp.organization.id, resp.user.id

@pytest.mark.asyncio
async def test_workspace_members_and_invitations(test_db, setup_org):
    org_id, user_id = setup_org

    # 1. Create a second user and member in the same org
    colleague_user = User(
        org_id=org_id,
        email="colleague@govcorp.example",
        full_name="Allison Cameron",
        hashed_password="mock-password-hash",
    )
    test_db.add(colleague_user)
    await test_db.flush()

    colleague_member = WorkspaceMember(
        org_id=org_id,
        user_id=colleague_user.id,
        role=WorkspaceRole.CREATOR,
    )
    test_db.add(colleague_member)
    await test_db.commit()

    # 2. Update colleague's role to REVIEWER
    from app.api.v1.workspaces import update_member_role
    from types import SimpleNamespace
    mock_admin_user = SimpleNamespace(org_id=org_id, user_id=user_id, is_demo=False)

    update_res = await update_member_role(
        target_user_id=colleague_user.id,
        request=UpdateMemberRoleRequest(role="REVIEWER"),
        user=mock_admin_user,
        db=test_db,
    )
    assert update_res["role"] == "REVIEWER"

    # 3. Create invitation
    from app.api.v1.workspaces import create_invitation, list_invitations, delete_invitation
    invite_res = await create_invitation(
        request=InviteMemberRequest(email="newhire@govcorp.example", role="MANAGER"),
        user=mock_admin_user,
        db=test_db,
    )
    assert invite_res.email == "newhire@govcorp.example"
    assert invite_res.role == "MANAGER"

    # 4. List invitations
    invites = await list_invitations(user=mock_admin_user, db=test_db)
    assert len(invites) == 1
    assert invites[0].email == "newhire@govcorp.example"

    # 5. Revoke invitation
    await delete_invitation(invitation_id=invite_res.id, user=mock_admin_user, db=test_db)
    invites_after = await list_invitations(user=mock_admin_user, db=test_db)
    assert len(invites_after) == 0

@pytest.mark.asyncio
async def test_insights_metrics(test_db, setup_org):
    org_id, user_id = setup_org

    # 1. Add content and analysis run
    content = ContentItem(
        org_id=org_id,
        title="Health Claim Test",
        content_type=ContentType.WEBSITE_COPY,
        channel=Channel.WEBSITE,
        original_content="Clinically proven formula.",
        current_content="Clinically proven formula.",
        content_hash="mock-hash-12345",
        status=ContentStatus.APPROVED,
        created_by=user_id,
    )
    test_db.add(content)
    await test_db.flush()

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

    finding = Finding(
        org_id=org_id,
        content_id=content.id,
        analysis_run_id=run.id,
        finding_type=FindingType.FACTUAL_CONTRADICTION,
        severity=Severity.HIGH,
        title="Unsubstantiated Clinical Claim",
        excerpt="Clinically proven formula.",
        explanation="Clinical trials required for this statement.",
        confidence=0.92,
        status="OVERRIDDEN",
    )
    test_db.add(finding)
    await test_db.flush()

    feedback = FindingFeedback(
        org_id=org_id,
        finding_id=finding.id,
        user_id=user_id,
        feedback_type=FeedbackType.OVERRIDDEN,
        reason="Approved clinical pilot paper attached under ref #902",
    )
    test_db.add(feedback)
    await test_db.commit()

    from app.api.v1.insights import get_insights
    from types import SimpleNamespace
    mock_user = SimpleNamespace(org_id=org_id, user_id=user_id)

    insights = await get_insights(user=mock_user, db=test_db)
    assert insights.total_submissions == 1
    assert insights.approved == 1
    assert insights.total_feedback == 1
    assert len(insights.top_reasons) == 1
    assert insights.top_reasons[0]["count"] == 1
