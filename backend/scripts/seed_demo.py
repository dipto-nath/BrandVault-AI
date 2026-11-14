#!/usr/bin/env python3
"""Seed script for NexaTech demo data."""

import asyncio
import sys
import os
from uuid import UUID
from datetime import datetime, timezone, timedelta
from decimal import Decimal

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.organization import Organization, User, WorkspaceMember, WorkspaceRole
from app.models.source import Source, SourceStatus
from app.models.fact import ApprovedFact, FactVerificationStatus
from app.models.guideline import BrandGuideline, GuidelineCategory, Severity
from app.core.security import get_password_hash


async def seed_demo():
    """Seed the database with NexaTech demo data."""
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        from sqlalchemy import select
        existing = await db.execute(
            select(Organization).where(Organization.slug == "nexatech")
        )
        if existing.scalar_one_or_none():
            print("Demo data already exists, skipping...")
            return
        
        org = Organization(
            id=UUID("11111111-1111-1111-1111-111111111111"),
            name="NexaTech",
            slug="nexatech",
            description="Fictional Indian consumer technology company — demo workspace for BrandVault AI.",
            settings={},
        )
        db.add(org)
        
        demo_user_id = UUID(settings.DEMO_USER_ID)
        user = User(
            id=demo_user_id,
            org_id=org.id,
            email="demo@nexatech.example",
            full_name="Demo Reviewer",
            hashed_password=get_password_hash("demo123"),
            is_active=True,
        )
        db.add(user)
        
        member = WorkspaceMember(
            org_id=org.id,
            user_id=user.id,
            role=WorkspaceRole.ADMIN,
        )
        db.add(member)
        
        await db.flush()
        
        guidelines = [
            BrandGuideline(
                org_id=org.id,
                rule_code="RULE-TONE-001",
                title="No unsupported superlatives",
                description="Claims like 'best', '#1', 'unmatched', 'world-class' require approved evidence before publication.",
                category=GuidelineCategory.TERMINOLOGY,
                severity=Severity.HIGH,
                pattern=r"world's best|number one|unmatched|best-in-class|the best|world-class|#1",
                replacement=None,
                active=True,
                created_by=user.id,
            ),
            BrandGuideline(
                org_id=org.id,
                rule_code="RULE-TERM-001",
                title="Preferred terminology: Smart Assistant",
                description="Use 'smart assistant' instead of 'AI robot buddy', 'AI robot', or 'robot buddy'.",
                category=GuidelineCategory.TERMINOLOGY,
                severity=Severity.MEDIUM,
                pattern=r"ai robot buddy|ai robot|robot buddy",
                replacement="smart assistant",
                active=True,
                created_by=user.id,
            ),
            BrandGuideline(
                org_id=org.id,
                rule_code="RULE-CLAIM-001",
                title="Numeric specifications must match approved facts",
                description="All numeric product specifications (battery life, weight, dimensions, etc.) must exactly match approved facts.",
                category=GuidelineCategory.CLAIMS,
                severity=Severity.HIGH,
                active=True,
                created_by=user.id,
            ),
            BrandGuideline(
                org_id=org.id,
                rule_code="RULE-CLAIM-002",
                title="Waterproof claims require explicit approval",
                description="Do not communicate waterproofing or water resistance without an approved rating.",
                category=GuidelineCategory.CLAIMS,
                severity=Severity.HIGH,
                pattern=r"waterproof|water-resistant|water resistant|splash-proof|splash proof",
                replacement="splash-resistant (see specifications for details)",
                active=True,
                created_by=user.id,
            ),
            BrandGuideline(
                org_id=org.id,
                rule_code="RULE-TONE-002",
                title="Professional tone required",
                description="Marketing content should maintain a professional, confident tone without hyperbole.",
                category=GuidelineCategory.TONE,
                severity=Severity.MEDIUM,
                active=True,
                created_by=user.id,
            ),
        ]
        
        for g in guidelines:
            db.add(g)
        
        await db.flush()
        
        facts = [
            ApprovedFact(
                org_id=org.id,
                fact_code="FACT-001",
                title="Battery Life",
                fact_text="Up to 12 hours of battery life with ANC on",
                entity_name="NexaTech Buds X",
                attribute_name="battery_life",
                value_numeric=Decimal("12"),
                unit="hours",
                qualifier="up to",
                source_name="Product Specification v4",
                source_reference="Page 3",
                source_excerpt="Battery life: up to 12 hours (ANC on), 18 hours (ANC off)",
                source_page_start=3,
                source_page_end=3,
                verification_status=FactVerificationStatus.APPROVED,
                effective_from=datetime.now(timezone.utc) - timedelta(days=30),
                created_by=user.id,
            ),
            ApprovedFact(
                org_id=org.id,
                fact_code="FACT-002",
                title="Bluetooth Version",
                fact_text="Bluetooth 5.0 with multipoint pairing",
                entity_name="NexaTech Buds X",
                attribute_name="bluetooth_version",
                value_text="5.0",
                source_name="Product Specification v4",
                source_reference="Page 2",
                source_excerpt="Bluetooth 5.0 with multipoint pairing",
                source_page_start=2,
                source_page_end=2,
                verification_status=FactVerificationStatus.APPROVED,
                effective_from=datetime.now(timezone.utc) - timedelta(days=30),
                created_by=user.id,
            ),
            ApprovedFact(
                org_id=org.id,
                fact_code="FACT-003",
                title="Weight",
                fact_text="Each earbud weighs 4.2 grams; case weighs 38 grams",
                entity_name="NexaTech Buds X",
                attribute_name="weight",
                value_numeric=Decimal("4.2"),
                unit="grams",
                source_name="Product Specification v4",
                source_reference="Page 4",
                source_excerpt="Earbud weight: 4.2g each; Charging case: 38g",
                source_page_start=4,
                source_page_end=4,
                verification_status=FactVerificationStatus.APPROVED,
                effective_from=datetime.now(timezone.utc) - timedelta(days=30),
                created_by=user.id,
            ),
            ApprovedFact(
                org_id=org.id,
                fact_code="FACT-004",
                title="Warranty",
                fact_text="Two-year limited warranty from date of purchase",
                entity_name="NexaTech Buds X",
                attribute_name="warranty",
                value_numeric=Decimal("2"),
                unit="years",
                source_name="Warranty Policy v2",
                source_reference="Section 1",
                source_excerpt="Two-year limited warranty from date of purchase",
                source_page_start=1,
                source_page_end=1,
                verification_status=FactVerificationStatus.APPROVED,
                effective_from=datetime.now(timezone.utc) - timedelta(days=60),
                created_by=user.id,
            ),
            ApprovedFact(
                org_id=org.id,
                fact_code="FACT-005",
                title="Waterproof Rating",
                fact_text="No approved waterproof rating is currently documented",
                entity_name="NexaTech Buds X",
                attribute_name="waterproof_rating",
                value_text="None",
                source_name="Product Claims Register",
                source_reference="FACT-005",
                source_excerpt="No approved waterproof rating is currently documented for NexaTech Buds X",
                verification_status=FactVerificationStatus.APPROVED,
                effective_from=datetime.now(timezone.utc) - timedelta(days=30),
                created_by=user.id,
            ),
            ApprovedFact(
                org_id=org.id,
                fact_code="FACT-006",
                title="Charging Time",
                fact_text="10 minutes charging gives 2 hours playback",
                entity_name="NexaTech Buds X",
                attribute_name="quick_charge",
                value_text="10 min = 2 hrs",
                source_name="Product Specification v4",
                source_reference="Page 3",
                source_excerpt="Quick charge: 10 minutes for 2 hours playback",
                source_page_start=3,
                source_page_end=3,
                verification_status=FactVerificationStatus.APPROVED,
                effective_from=datetime.now(timezone.utc) - timedelta(days=30),
                created_by=user.id,
            ),
        ]
        
        for f in facts:
            db.add(f)
        
        await db.commit()
        print("✓ Demo data seeded successfully!")
        print(f"  Organization: {org.name} ({org.slug})")
        print(f"  Demo User: {user.email} (password: demo123)")
        print(f"  Guidelines: {len(guidelines)}")
        print(f"  Approved Facts: {len(facts)}")
        
        print("\nTo test the demo:")
        print("  POST /api/v1/auth/demo with {\"workspace_slug\": \"nexatech\"}")
        print("  Or login with email: demo@nexatech.example, password: demo123")


if __name__ == "__main__":
    asyncio.run(seed_demo())
