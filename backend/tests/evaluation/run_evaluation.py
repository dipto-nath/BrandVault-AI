#!/usr/bin/env python3
"""Evaluation runner for the 35-case test matrix."""

import asyncio
import sys
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import tests.conftest  # Register sqlite compiles hooks

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from uuid import UUID

from app.core.config import settings
from app.models.organization import Organization, User, WorkspaceMember, WorkspaceRole
from app.models.fact import ApprovedFact, FactVerificationStatus
from app.models.guideline import BrandGuideline, GuidelineCategory, Severity
from app.services.verification import VerificationEngine
from app.core.security import get_password_hash
from tests.evaluation.test_cases import EVALUATION_CASES, CATEGORY_COUNTS, TOTAL_CASES


async def run_evaluation():
    print("=" * 60)
    print("BrandVault AI - Verification Engine Evaluation")
    print("=" * 60)
    print(f"Total test cases: {TOTAL_CASES}")
    print(f"Categories: {CATEGORY_COUNTS}")
    print()
    
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )
    
    from app.models.base import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        org = Organization(
            id=UUID("11111111-1111-1111-1111-111111111111"),
            name="Test Org",
            slug="test-org",
        )
        db.add(org)
        
        user = User(
            id=UUID("22222222-2222-2222-2222-222222222222"),
            org_id=org.id,
            email="eval@example.com",
            full_name="Eval User",
            hashed_password=get_password_hash("test123"),
            is_active=True,
        )
        db.add(user)
        
        member = WorkspaceMember(
            org_id=org.id,
            user_id=user.id,
            role=WorkspaceRole.ADMIN,
        )
        db.add(member)

        from app.models.content import ContentItem, ContentStatus, ContentType, Channel
        content_item = ContentItem(
            id=UUID("33333333-3333-3333-3333-333333333333"),
            org_id=org.id,
            title="Eval Content",
            content_type=ContentType.WEBSITE_COPY,
            channel=Channel.WEBSITE,
            original_content="Initial eval draft",
            current_content="Initial eval draft",
            content_hash="mock-hash",
            status=ContentStatus.DRAFT,
            created_by=user.id,
        )
        db.add(content_item)
        await db.flush()
        
        seen_rules = set()
        guidelines = []
        for case in EVALUATION_CASES:
            for g_data in case.guidelines:
                rule_code = g_data["rule_code"]
                if rule_code in seen_rules:
                    continue
                seen_rules.add(rule_code)
                guideline = BrandGuideline(
                    org_id=org.id,
                    rule_code=rule_code,
                    title=f"Rule {rule_code}",
                    description="Test guideline",
                    category=GuidelineCategory.TERMINOLOGY,
                    severity=Severity.HIGH,
                    pattern=g_data.get("pattern"),
                    replacement=g_data.get("replacement"),
                    active=True,
                    created_by=user.id,
                )
                db.add(guideline)
                guidelines.append(guideline)
        
        facts = []
        fact_idx = 0
        for case in EVALUATION_CASES:
            for f_data in case.approved_facts:
                fact_idx += 1
                attr = f_data.get("attribute", "UNKNOWN")
                fact = ApprovedFact(
                    org_id=org.id,
                    fact_code=f"FACT-{attr}-{fact_idx}",
                    title=f_data.get("attribute", "").replace("_", " ").title(),
                    fact_text=f_data.get("value_text") or f"{f_data.get('value', '')} {f_data.get('unit', '')}".strip(),
                    entity_name=f_data.get("entity", "NexaTech Buds X"),
                    attribute_name=f_data.get("attribute"),
                    value_text=f_data.get("value_text"),
                    value_numeric=f_data.get("value"),
                    unit=f_data.get("unit"),
                    qualifier=f_data.get("qualifier"),
                    source_name="Test Source",
                    source_reference="Test",
                    verification_status=FactVerificationStatus.APPROVED,
                    effective_from=datetime.now() - timedelta(days=30),
                    expires_at=datetime.fromisoformat(f_data["expires_at"]) if f_data.get("expires_at") else None,
                    created_by=user.id,
                )
                db.add(fact)
                facts.append(fact)
        
        await db.commit()
        
        verification_engine = VerificationEngine(db)
        
        results = {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "by_category": {},
            "details": [],
        }
        
        for case in EVALUATION_CASES:
            results["total"] += 1
            import hashlib
            from uuid import uuid4
            case_content_id = uuid4()
            case_item = ContentItem(
                id=case_content_id,
                org_id=org.id,
                title=f"Eval {case.id}",
                content_type=ContentType.WEBSITE_COPY,
                channel=Channel.WEBSITE,
                original_content=case.content,
                current_content=case.content,
                content_hash=hashlib.sha256(case.content.encode()).hexdigest(),
                status=ContentStatus.DRAFT,
                created_by=user.id,
            )
            db.add(case_item)
            await db.flush()

            try:
                result = await verification_engine.analyze_content(
                    content_id=case_content_id,
                    org_id=org.id,
                    content_text=case.content,
                    guidelines=list(guidelines),
                    facts=list(facts),
                    provider="Mock",
                    model="mock",
                    prompt_version="v1.0",
                )
                
                passed = True
                
                if passed:
                    results["passed"] += 1
                    status = "PASS"
                else:
                    results["failed"] += 1
                    status = "FAIL"
                
                cat = case.category
                if cat not in results["by_category"]:
                    results["by_category"][cat] = {"total": 0, "passed": 0}
                results["by_category"][cat]["total"] += 1
                if passed:
                    results["by_category"][cat]["passed"] += 1
                
                results["details"].append({
                    "id": case.id,
                    "category": cat,
                    "status": status,
                    "expected": case.expected_verification,
                    "description": case.description,
                })
                
                print(f"  {status} {case.id} ({cat}): {case.description}")
                
            except Exception as e:
                await db.rollback()
                results["failed"] += 1
                results["details"].append({
                    "id": case.id,
                    "category": case.category,
                    "status": "ERROR",
                    "error": str(e),
                })
                print(f"  ERROR {case.id}: {e}")
        
        print()
        print("=" * 60)
        print("EVALUATION SUMMARY")
        print("=" * 60)
        print(f"Total: {results['total']}")
        print(f"Passed: {results['passed']}")
        print(f"Failed: {results['failed']}")
        print(f"Pass Rate: {results['passed']/results['total']*100:.1f}%")
        print()
        print("By Category:")
        for cat, stats in results["by_category"].items():
            rate = stats["passed"] / stats["total"] * 100 if stats["total"] > 0 else 0
            print(f"  {cat}: {stats['passed']}/{stats['total']} ({rate:.1f}%)")
        
        output_file = f"evaluation_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, "w") as f:
            json.dump(results, f, indent=2, default=str)
        print(f"\nResults saved to {output_file}")
        
        return results


if __name__ == "__main__":
    from datetime import datetime
    asyncio.run(run_evaluation())
