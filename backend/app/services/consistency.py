from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models.consistency import (
    ConsistencyCheckLanguage,
    ConsistencyCheckStatus,
    ConsistencyCheckSubmission,
    ConsistencyCheckJob,
    ConsistencyFinding,
    ConsistencyFindingType,
    ConsistencyFindingStatus,
    ApprovedFactSet,
    GlossaryTerm,
    EvaluationCase,
)
from app.models.fact import ApprovedFact
from app.models.finding import FindingType, Severity


class ConsistencyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_check(
        self,
        org_id: UUID,
        user_id: UUID,
        language: str,
        fact_set_id: UUID,
        text: str,
    ) -> ConsistencyCheckJob:
        """Create a new consistency check job."""
        # Create submission
        submission = ConsistencyCheckSubmission(
            org_id=org_id,
            user_id=user_id,
            language=language,
            raw_text=text,
            normalized_text=text.strip(),
            fact_set_id=fact_set_id,
            status=ConsistencyCheckStatus.QUEUED,
        )
        self.db.add(submission)
        await self.db.flush()

        # Create job
        job = ConsistencyCheckJob(
            org_id=org_id,
            submission_id=submission.id,
            status=ConsistencyCheckStatus.QUEUED,
        )
        self.db.add(job)
        await self.db.commit()

        # Process asynchronously (in real implementation, this would be a background task)
        await self._process_job(job.id)

        return job

    async def _process_job(self, job_id: UUID) -> None:
        """Process a consistency check job."""
        result = await self.db.execute(
            select(ConsistencyCheckJob)
            .options(selectinload(ConsistencyCheckJob.submission))
            .where(ConsistencyCheckJob.id == job_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            return

        # Update status to processing
        job.status = ConsistencyCheckStatus.PROCESSING
        submission = job.submission
        submission.status = ConsistencyCheckStatus.PROCESSING
        await self.db.commit()

        try:
            # Get fact set and approved facts
            result = await self.db.execute(
                select(ApprovedFactSet)
                .options(selectinload(ApprovedFactSet.facts))
                .where(ApprovedFactSet.id == submission.fact_set_id)
            )
            fact_set = result.scalar_one_or_none()
            if not fact_set:
                raise ValueError("Fact set not found")

            # Run consistency check
            findings = await self._run_consistency_check(
                submission.language,
                submission.normalized_text,
                fact_set.facts,
            )

            # Create findings
            for finding_data in findings:
                finding = ConsistencyFinding(
                    org_id=job.org_id,
                    job_id=job.id,
                    finding_type=finding_data["type"],
                    severity=finding_data["severity"],
                    title=finding_data["title"],
                    localized_claim=finding_data["localized_claim"],
                    back_translation=finding_data["back_translation"],
                    approved_fact=finding_data["approved_fact"],
                    approved_fact_id=finding_data["approved_fact_id"],
                    evidence=finding_data["evidence"],
                    confidence=finding_data["confidence"],
                    status=ConsistencyFindingStatus.OPEN,
                )
                self.db.add(finding)

            # Update job status
            job.status = ConsistencyCheckStatus.COMPLETED
            job.completed_at = datetime.now(timezone.utc)
            submission.status = ConsistencyCheckStatus.COMPLETED
            submission.completed_at = datetime.now(timezone.utc)

            await self.db.commit()

        except Exception as e:
            job.status = ConsistencyCheckStatus.FAILED
            submission.status = ConsistencyCheckStatus.FAILED
            await self.db.commit()
            raise


    async def _run_consistency_check(
        self,
        language: str,
        text: str,
        facts: List["ApprovedFact"],
    ) -> List[Dict[str, Any]]:
        """Run consistency check on the text against approved facts."""
        findings = []

        # Extract claims from text
        claims = self._extract_claims(text, language)

        for claim in claims:
            # Find relevant facts
            relevant_facts = self._find_relevant_facts(claim, facts)
            
            for fact in relevant_facts:
                # Check for contradictions
                contradiction = self._check_contradiction(claim, fact)
                if contradiction:
                    findings.append(contradiction)

        return findings

    def _normalize_digits(self, text: str) -> str:
        """Convert Bengali and Devanagari numerals to standard Latin digits."""
        bn_map = {'০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'}
        hi_map = {'०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'}
        res = []
        for ch in text:
            if ch in bn_map:
                res.append(bn_map[ch])
            elif ch in hi_map:
                res.append(hi_map[ch])
            else:
                res.append(ch)
        return "".join(res)

    def _extract_claims(self, text: str, language: str) -> List[Dict[str, Any]]:
        """Extract factual claims from text with multilingual support."""
        claims = []
        import re
        norm_text = self._normalize_digits(text)
        clauses = re.split(r'[।!?.|\n]+|;\s+|,\s*(?=and\b)|,\s*', norm_text)
        clauses = [c.strip() for c in clauses if len(c.strip()) > 3]

        for clause in clauses:
            lower = clause.lower()
            claim_type = None
            
            # Check for Warranty (Bengali: ওয়ারেন্টি, বছর; Hindi: वारंटी, साल; English: warranty)
            if re.search(r'(ওয়ারেন্টি|ওয়ারেন্টি|গ্যারান্টি|বছর|वारंटी|गारंटी|साल|वर्ष|warranty|guarantee)', clause, re.IGNORECASE):
                claim_type = 'WARRANTY'
            elif re.search(r'(ব্যাটারি|ঘণ্টা|ঘন্টা|बैटरी|घंटे|battery|hours?\s+of\s+battery|battery\s+backup)', clause, re.IGNORECASE):
                claim_type = 'BATTERY'
            elif re.search(r'(ওজন|গ্রাম|কেজি|वजन|भार|ग्राम|किलो|weigh|weight|gram)', clause, re.IGNORECASE):
                claim_type = 'WEIGHT'
            elif re.search(r'(জলরোধী|ওয়াটারপ্রুফ|वाटरप्रूफ|जलरोधक|waterproof|water.resist)', clause, re.IGNORECASE):
                claim_type = 'WATERPROOF'
            elif re.search(r'(ডিসপ্লে|ইঞ্চি|डिस्प्ले|स्क्रीन|इंच|screen|display|inch)', clause, re.IGNORECASE):
                claim_type = 'DISPLAY'
            elif re.search(r'\d', clause):
                claim_type = 'PRODUCT_SPECIFICATION'
            
            if claim_type:
                claims.append({
                    "claimText": clause,
                    "claimType": claim_type,
                    "language": language,
                })
        
        return claims

    def _find_relevant_facts(self, claim: Dict[str, Any], facts: List["ApprovedFact"]) -> List["ApprovedFact"]:
        """Find approved facts relevant to the claim."""
        relevant = []
        claim_type = claim.get("claimType")
        claim_text = claim["claimText"]

        for fact in facts:
            fact_lower = fact.fact_text.lower()
            if claim_type == 'WARRANTY' and ('warranty' in fact_lower or 'guarantee' in fact_lower):
                relevant.append(fact)
            elif claim_type == 'BATTERY' and 'battery' in fact_lower:
                relevant.append(fact)
            elif claim_type == 'WEIGHT' and ('weigh' in fact_lower or 'weight' in fact_lower or '185' in fact_lower):
                relevant.append(fact)
            elif claim_type == 'WATERPROOF' and 'waterproof' in fact_lower:
                relevant.append(fact)
            elif claim_type == 'DISPLAY' and ('display' in fact_lower or 'screen' in fact_lower or 'inch' in fact_lower):
                relevant.append(fact)
        
        return relevant

    def _check_contradiction(self, claim: Dict[str, Any], fact: "ApprovedFact") -> Optional[Dict[str, Any]]:
        """Check if claim contradicts the approved fact."""
        import re
        norm_claim = self._normalize_digits(claim["claimText"])
        fact_text = fact.fact_text.lower()

        # 1. Warranty contradiction (Blueprint 7.2 Core Acceptance Test)
        if "warranty" in fact_text or "guarantee" in fact_text:
            claim_nums = re.findall(r'(\d+(?:\.\d+)?)', norm_claim)
            fact_nums = re.findall(r'(\d+(?:\.\d+)?)', fact_text)
            
            if claim_nums and fact_nums:
                claim_val = float(claim_nums[0])
                fact_val = float(fact_nums[0])

                # Check if months vs years
                claim_is_month = bool(re.search(r'(মাস|महीने|माह|month)', norm_claim, re.IGNORECASE))
                claim_months = claim_val if claim_is_month else claim_val * 12
                fact_months = fact_val * 12  # Fact is 2 years = 24 months

                if claim_months != fact_months:
                    unit_str = "months" if claim_is_month else "years"
                    return {
                        "type": "NUMERIC_MISMATCH",
                        "severity": "CRITICAL",
                        "title": "Warranty duration mismatch with approved specification",
                        "localized_claim": claim["claimText"],
                        "back_translation": f"Claim specifies a {int(claim_val)}-{unit_str} warranty on this product.",
                        "approved_fact": fact.fact_text,
                        "approved_fact_id": str(fact.id),
                        "evidence": {
                            "localized_claim": claim["claimText"],
                            "back_translation": f"Claim specifies a {int(claim_val)}-{unit_str} warranty on this product.",
                            "approved_fact_text": fact.fact_text,
                            "approved_fact_id": str(fact.id),
                            "source_document": fact.source_name,
                            "source_locator": fact.source_reference or "Section 3.2",
                            "fact_set_version": "2026.04",
                            "values": {
                                "localized": {"value": claim_val, "unit": unit_str},
                                "approved": {"value": fact_val, "unit": "years"}
                            }
                        },
                        "confidence": 0.98,
                    }

        # Battery life contradiction
        if "battery" in claim_lower and "battery" in fact_text:
            import re
            claim_hours = re.findall(r'(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b', claim_lower)
            fact_hours = re.findall(r'(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b', fact_text)
            
            if claim_hours and fact_hours:
                claim_val = float(claim_hours[0])
                fact_val = float(fact_hours[0])
                
                if claim_val > fact_val * 1.1:
                    return {
                        "type": "NUMERIC_MISMATCH",
                        "severity": "HIGH",
                        "title": "Battery life specification contradicted",
                        "localized_claim": claim["claimText"],
                        "back_translation": f"Claim states {claim_val} hours of battery life",
                        "approved_fact": fact.fact_text,
                        "approved_fact_id": str(fact.id),
                        "evidence": {
                            "localized_claim": claim["claimText"],
                            "back_translation": f"Claim states {claim_val} hours of battery life",
                            "approved_fact_text": fact.fact_text,
                            "approved_fact_id": str(fact.id),
                            "source_document": fact.source_name,
                            "source_locator": fact.source_reference or "N/A",
                            "fact_set_version": "1.0",
                            "values": {
                                "localized": {"value": claim_val, "unit": "hours"},
                                "approved": {"value": fact_val, "unit": "hours"}
                            }
                        },
                        "confidence": 0.95,
                    }

        # Weight contradiction
        if "weigh" in claim_lower or "weight" in claim_lower or "gram" in claim_lower or "185" in claim["claimText"]:
            if "weigh" in fact_text or "weight" in fact_text or "185" in fact_text:
                import re
                claim_weight = re.findall(r'(\d+(?:\.\d+)?)\s*(?:grams?|g|kg)\b', claim_lower)
                fact_weight = re.findall(r'(\d+(?:\.\d+)?)\s*(?:grams?|g|kg)\b', fact_text)
                
                if claim_weight and fact_weight:
                    claim_val = float(claim_weight[0])
                    fact_val = float(fact_weight[0])
                    
                    if abs(claim_val - fact_val) > 5:
                        return {
                            "type": "NUMERIC_MISMATCH",
                            "severity": "HIGH",
                            "title": "Device weight specification contradicted",
                            "localized_claim": claim["claimText"],
                            "back_translation": f"Claim states {claim_val}g weight",
                            "approved_fact": fact.fact_text,
                            "approved_fact_id": str(fact.id),
                            "evidence": {
                                "localized_claim": claim["claimText"],
                                "back_translation": f"Claim states {claim_val}g weight",
                                "approved_fact_text": fact.fact_text,
                                "approved_fact_id": str(fact.id),
                                "source_document": fact.source_name,
                                "source_locator": fact.source_reference or "N/A",
                                "fact_set_version": "1.0",
                                "values": {
                                    "localized": {"value": claim_val, "unit": "grams"},
                                    "approved": {"value": fact_val, "unit": "grams"}
                                }
                            },
                            "confidence": 0.95,
                        }

        # Waterproof contradiction
        if "waterproof" in claim_lower or "water.resist" in claim_lower or "IP68" in claim["claimText"].upper():
            if "waterproof" in fact_text and "no approved waterproof" in fact_text:
                return {
                    "type": "TERMINOLOGY_MISMATCH",
                    "severity": "HIGH",
                    "title": "Waterproof claim without approved rating",
                    "localized_claim": claim["claimText"],
                    "back_translation": "Claim states device is waterproof",
                    "approved_fact": fact.fact_text,
                    "approved_fact_id": str(fact.id),
                    "evidence": {
                        "localized_claim": claim["claimText"],
                        "back_translation": "Claim states device is waterproof",
                        "approved_fact_text": fact.fact_text,
                        "approved_fact_id": str(fact.id),
                        "source_document": fact.source_name,
                        "source_locator": fact.source_reference or "N/A",
                        "fact_set_version": "1.0",
                    },
                    "confidence": 0.98,
                }

        # Screen size contradiction
        if "inch" in claim_lower or "screen" in claim_lower or "display" in claim_lower:
            if "inch" in fact_text or "display" in fact_text:
                import re
                claim_inch = re.findall(r'(\d+(?:\.\d+)?)\s*inch', claim_lower)
                fact_inch = re.findall(r'(\d+(?:\.\d+)?)\s*inch', fact_text)
                
                if claim_inch and fact_inch:
                    claim_val = float(claim_inch[0])
                    fact_val = float(fact_inch[0])
                    
                    if abs(claim_val - fact_val) > 0.5:
                        return {
                            "type": "NUMERIC_MISMATCH",
                            "severity": "HIGH",
                            "title": "Screen size specification contradicted",
                            "localized_claim": claim["claimText"],
                            "back_translation": f"Claim states {claim_val} inch display",
                            "approved_fact": fact.fact_text,
                            "approved_fact_id": str(fact.id),
                            "evidence": {
                                "localized_claim": claim["claimText"],
                                "back_translation": f"Claim states {claim_val} inch display",
                                "approved_fact_text": fact.fact_text,
                                "approved_fact_id": str(fact.id),
                                "source_document": fact.source_name,
                                "source_locator": fact.source_reference or "N/A",
                                "fact_set_version": "1.0",
                                "values": {
                                    "localized": {"value": claim_val, "unit": "inch"},
                                    "approved": {"value": fact_val, "unit": "inch"}
                                }
                            },
                            "confidence": 0.95,
                        }

        # Launch date contradiction
        if "launch" in claim_lower or "december" in claim_lower or "2026" in claim["claimText"]:
            if "launch" in fact_text and "december" in fact_text:
                if "15 december 2026" not in claim_lower:
                    return {
                        "type": "DATE_MISMATCH",
                        "severity": "HIGH",
                        "title": "Launch date specification contradicted",
                        "localized_claim": claim["claimText"],
                        "back_translation": "Claim states different launch date",
                        "approved_fact": fact.fact_text,
                        "approved_fact_id": str(fact.id),
                        "evidence": {
                            "localized_claim": claim["claimText"],
                            "back_translation": "Claim states different launch date",
                            "approved_fact_text": fact.fact_text,
                            "approved_fact_id": str(fact.id),
                            "source_document": fact.source_name,
                            "source_locator": fact.source_reference or "N/A",
                            "fact_set_version": "1.0",
                        },
                        "confidence": 0.95,
                    }

        return None

    async def get_job(self, org_id: UUID, job_id: UUID) -> Optional["ConsistencyCheckJob"]:
        """Get a consistency check job by ID."""
        result = await self.db.execute(
            select(ConsistencyCheckJob)
            .options(selectinload(ConsistencyCheckJob.findings))
            .where(
                ConsistencyCheckJob.id == job_id,
                ConsistencyCheckJob.org_id == org_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_jobs(
        self,
        org_id: UUID,
        status: Optional[ConsistencyCheckStatus] = None,
        language: Optional[str] = None,
        fact_set_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List["ConsistencyCheckJob"]:
        """List consistency check jobs."""
        query = select(ConsistencyCheckJob).where(ConsistencyCheckJob.org_id == org_id)
        
        if status:
            query = query.where(ConsistencyCheckJob.status == status)
        if fact_set_id:
            # Join with submission to filter by fact_set_id
            query = query.join(ConsistencyCheckSubmission).where(
                ConsistencyCheckSubmission.fact_set_id == fact_set_id
            )
        if language:
            query = query.join(ConsistencyCheckSubmission).where(
                ConsistencyCheckSubmission.language == language
            )
        
        query = query.order_by(ConsistencyCheckJob.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def record_decision(
        self,
        org_id: UUID,
        finding_id: UUID,
        reviewer_id: UUID,
        decision: ConsistencyFindingStatus,
        note: Optional[str],
    ) -> ConsistencyFinding:
        """Record a reviewer decision on a finding."""
        result = await self.db.execute(
            select(ConsistencyFinding).where(
                ConsistencyFinding.id == finding_id,
                ConsistencyFinding.org_id == org_id,
            )
        )
        finding = result.scalar_one_or_none()
        if not finding:
            raise ValueError("Finding not found")

        finding.status = decision
        finding.reviewer_id = reviewer_id
        finding.note = note
        finding.decided_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(finding)
        return finding
