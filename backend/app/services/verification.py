from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
import structlog
import hashlib

from app.models.content import ContentItem, ContentStatus, RiskLevel
from app.models.analysis import AnalysisRun, AnalysisStatus, Claim, VerificationStatus
from app.models.finding import Finding, FindingType, Severity, FindingEvidence, EvidenceRelation
from app.models.guideline import BrandGuideline
from app.models.fact import ApprovedFact
from app.models.source import SourceChunk
from app.schemas.analysis import ClaimResponse, FindingResponse
from app.agents.llm import get_llm_provider
from app.agents.prompts import (
    format_claim_extraction_prompt,
    format_deterministic_check_prompt,
    format_contextual_verification_prompt,
    format_tone_analysis_prompt,
    format_guideline_check_prompt,
    format_correction_prompt,
)
from app.agents.embeddings import get_embeddings
from app.services.audit import AuditService
from app.utils.unit_normalizer import compare_values, extract_qualifier

logger = structlog.get_logger()


class VerificationEngine:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.llm = get_llm_provider()

    async def analyze_content(
        self,
        content_id: UUID,
        org_id: UUID,
        content_text: str,
        guidelines: List[BrandGuideline],
        facts: List[ApprovedFact],
        provider: str,
        model: str,
        prompt_version: str,
    ) -> Dict[str, Any]:
        """Run the full verification pipeline."""
        start_time = datetime.now(timezone.utc)
        
        # Create analysis run record
        run = AnalysisRun(
            org_id=org_id,
            content_id=content_id,
            provider=provider,
            model_name=model,
            prompt_version=prompt_version,
            status=AnalysisStatus.RUNNING,
            started_at=start_time,
        )
        self.db.add(run)
        await self.db.flush()
        
        try:
            # Stage 1: Claim Extraction
            claims = await self._stage1_extract_claims(content_text, {
                "product": "",
                "campaign": "",
                "locale": "en",
            })
            
            # Stage 2: Deterministic Check
            deterministic_results = await self._stage2_deterministic_check(claims, facts)
            
            # Stage 3: Semantic Retrieval for unresolved claims
            unresolved_claims = [c for c in claims if c["claim_text"] not in deterministic_results]
            semantic_results = await self._stage3_semantic_retrieval(unresolved_claims, org_id)
            
            # Stage 4: Contextual Verification
            contextual_results = await self._stage4_contextual_verification(unresolved_claims, semantic_results)
            
            # Combine all claim results
            all_claim_results = {**deterministic_results, **contextual_results}
            
            # Stage 5: Guideline Checks
            guideline_findings = await self._stage5_guideline_checks(content_text, guidelines)
            
            # Stage 6: Build findings from claims
            claim_findings = await self._build_claim_findings(all_claim_results, run.id, org_id, content_id)
            
            # Stage 7: Generate corrections
            all_findings = guideline_findings + claim_findings
            suggested_content = await self._stage7_generate_corrections(content_text, all_findings, all_claim_results)
            
            # Stage 8: Calculate risk level
            risk_level = self._calculate_risk_level(all_findings, all_claim_results)
            
            # Persist everything
            await self._persist_results(
                org_id, content_id, run.id,
                all_claim_results, all_findings, suggested_content, risk_level
            )
            
            # Update run status
            run.status = AnalysisStatus.COMPLETED
            run.completed_at = datetime.now(timezone.utc)
            run.duration_ms = int((run.completed_at - start_time).total_seconds() * 1000)
            run.result = {
                "summary": f"Analysis complete. {len(all_findings)} findings, {len(all_claim_results)} claims processed.",
                "risk_level": risk_level.value,
                "claims_count": len(all_claim_results),
                "findings_count": len(all_findings),
            }
            
            # Update content status
            content_result = await self.db.execute(
                select(ContentItem).where(ContentItem.id == content_id)
            )
            content = content_result.scalar_one_or_none()
            if content:
                content.status = ContentStatus.NEEDS_REVIEW if all_findings else ContentStatus.NEEDS_REVIEW
                content.risk_level = risk_level
            
            await self.db.commit()
            
            return {
                "run_id": str(run.id),
                "claims": all_claim_results,
                "findings": all_findings,
                "suggested_content": suggested_content,
                "risk_level": risk_level,
            }
            
        except Exception as e:
            logger.error("analysis_failed", error=str(e), content_id=str(content_id))
            run.status = AnalysisStatus.FAILED
            run.error_message = str(e)
            run.completed_at = datetime.now(timezone.utc)
            await self.db.commit()
            raise

    async def _stage1_extract_claims(self, content: str, context: Dict) -> List[Dict]:
        """Extract atomic claims from content using LLM."""
        prompt = format_claim_extraction_prompt(
            content=content,
            product_context=context.get("product", ""),
            campaign_context=context.get("campaign", ""),
            locale=context.get("locale", "en"),
        )
        
        from app.agents.llm import ClaimExtractionResponse
        result = await self.llm.generate_json(prompt, ClaimExtractionResponse)
        return result.claims

    async def _stage2_deterministic_check(
        self,
        claims: List[Dict],
        facts: List[ApprovedFact],
    ) -> Dict[str, Dict]:
        """Check claims against approved facts using exact matching."""
        results = {}
        
        for claim in claims:
            claim_text = claim["claim_text"]
            entity = claim.get("entity_name", "")
            attribute = claim.get("attribute_name", "")
            value = claim.get("normalized_value", "")
            unit = claim.get("unit", "")
            qualifier = claim.get("qualifier", "")
            
            # Find matching facts
            matching_facts = [
                f for f in facts
                if f.entity_name == entity and f.attribute_name == attribute
                and f.verification_status.value == "APPROVED"
            ]
            
            if not matching_facts:
                continue
            
            for fact in matching_facts:
                fact_value = fact.value_numeric
                fact_unit = fact.unit
                
                if fact_value is not None and value:
                    try:
                        claim_val = Decimal(value)
                        matches, explanation = compare_values(
                            claim_val, unit, fact_val, fact_unit,
                            qualifier, fact.qualifier
                        )
                        
                        results[claim_text] = {
                            "claim_text": claim_text,
                            "verification_status": VerificationStatus.SUPPORTED if matches else VerificationStatus.CONTRADICTED,
                            "confidence": 0.95,
                            "explanation": explanation,
                            "evidence": [{
                                "source_name": fact.source_name,
                                "page": fact.source_page_start,
                                "excerpt": fact.source_excerpt or fact.fact_text,
                                "relation": "SUPPORTS" if matches else "CONTRADICTS",
                            }],
                            "matched_fact_id": str(fact.id),
                        }
                        break
                    except:
                        continue
        
        return results

    async def _stage3_semantic_retrieval(
        self,
        claims: List[Dict],
        org_id: UUID,
    ) -> Dict[str, List[Dict]]:
        """Retrieve relevant source chunks for unresolved claims."""
        if not claims:
            return {}
        
        claim_texts = [c["claim_text"] for c in claims]
        embeddings = await get_embeddings(claim_texts)
        
        results = {}
        for claim, embedding in zip(claims, embeddings):
            # Vector search with pgvector
            from sqlalchemy import text
            query = text("""
                SELECT sc.id, sc.text, sc.page_start, sc.page_end, sc.source_id, s.source_name
                FROM source_chunks sc
                JOIN sources s ON sc.source_id = s.id
                WHERE sc.org_id = :org_id
                AND s.document_status = 'APPROVED'
                AND (s.valid_to IS NULL OR s.valid_to > NOW())
                ORDER BY sc.embedding <=> :embedding
                LIMIT 5
            """)
            
            result = await self.db.execute(query, {
                "org_id": org_id,
                "embedding": embedding,
            })
            
            chunks = []
            for row in result.all():
                chunks.append({
                    "source_chunk_id": str(row.id),
                    "source_name": row.source_name,
                    "page": row.page_start,
                    "excerpt": row.text[:500],
                })
            
            results[claim["claim_text"]] = chunks
        
        return results

    async def _stage4_contextual_verification(
        self,
        claims: List[Dict],
        chunks: Dict[str, List[Dict]],
    ) -> Dict[str, Dict]:
        """Use LLM to verify claims against retrieved chunks."""
        results = {}
        
        for claim in claims:
            claim_text = claim["claim_text"]
            claim_chunks = chunks.get(claim_text, [])
            
            if not claim_chunks:
                results[claim_text] = {
                    "claim_text": claim_text,
                    "verification_status": VerificationStatus.UNVERIFIED,
                    "confidence": 0.5,
                    "explanation": "No approved source evidence found for this claim.",
                    "evidence": [],
                }
                continue
            
            from app.agents.llm import ContextualVerificationResponse
            prompt = format_contextual_verification_prompt(
                claim_text=claim_text,
                entity_name=claim.get("entity_name", ""),
                attribute_name=claim.get("attribute_name", ""),
                normalized_value=claim.get("normalized_value", ""),
                unit=claim.get("unit", ""),
                qualifier=claim.get("qualifier", ""),
                claim_type=claim.get("claim_type", "FACTUAL_STATEMENT"),
                source_chunks=claim_chunks,
            )
            
            try:
                result = await self.llm.generate_json(prompt, ContextualVerificationResponse)
                for c in result.claims:
                    # Confidence calibration
                    if c.confidence < 0.85:
                        c.verification_status = VerificationStatus.UNVERIFIED
                        c.explanation += f" [Downgraded: confidence {c.confidence:.0%} below 85% threshold]"
                    results[claim_text] = c.model_dump()
            except Exception as e:
                logger.error("contextual_verification_failed", error=str(e))
                results[claim_text] = {
                    "claim_text": claim_text,
                    "verification_status": VerificationStatus.UNVERIFIED,
                    "confidence": 0.3,
                    "explanation": f"Verification failed: {e}",
                    "evidence": [],
                }
        
        return results

    async def _stage5_guideline_checks(self, content: str, guidelines: List[BrandGuideline]) -> List[Dict]:
        """Run deterministic guideline checks and LLM tone analysis."""
        findings = []
        
        # Deterministic pattern matching
        for guideline in guidelines:
            if not guideline.active or not guideline.pattern:
                continue
            
            import re
            matches = list(re.finditer(guideline.pattern, content, re.IGNORECASE))
            for match in matches:
                findings.append({
                    "finding_type": FindingType.TERMINOLOGY_VIOLATION if guideline.category.value == "TERMINOLOGY" else FindingType.GUIDELINE_VIOLATION,
                    "severity": guideline.severity,
                    "rule_id": str(guideline.id),
                    "title": f"Guideline violation: {guideline.title}",
                    "excerpt": match.group(),
                    "explanation": guideline.description,
                    "suggested_correction": guideline.replacement,
                    "confidence": 0.95,
                })
        
        # LLM tone analysis for subjective guidelines
        tone_guidelines = [g for g in guidelines if g.active and g.category.value in ["TONE", "POSITIONING"] and not g.pattern]
        if tone_guidelines:
            from app.agents.llm import ToneAnalysisResponse
            prompt = format_tone_analysis_prompt(
                content=content,
                guidelines=[{
                    "rule_code": g.rule_code,
                    "title": g.title,
                    "description": g.description,
                    "category": g.category.value,
                    "severity": g.severity.value,
                } for g in tone_guidelines],
            )
            
            try:
                result = await self.llm.generate_json(prompt, ToneAnalysisResponse)
                for f in result.findings:
                    f_dict = f.model_dump()
                    f_dict["finding_type"] = FindingType(f_dict["type"])
                    f_dict["severity"] = Severity(f_dict["severity"])
                    findings.append(f_dict)
            except Exception as e:
                logger.error("tone_analysis_failed", error=str(e))
        
        return findings

    async def _build_claim_findings(
        self,
        claim_results: Dict[str, Dict],
        run_id: UUID,
        org_id: UUID,
        content_id: UUID,
    ) -> List[Dict]:
        """Convert claim verification results to findings."""
        findings = []
        
        for claim_text, result in claim_results.items():
            status = result.get("verification_status")
            if status == VerificationStatus.CONTRADICTED:
                findings.append({
                    "finding_type": FindingType.FACTUAL_CONTRADICTION,
                    "severity": Severity.HIGH,
                    "rule_id": None,
                    "title": "Factual claim contradicted",
                    "excerpt": claim_text[:200],
                    "explanation": result.get("explanation", ""),
                    "suggested_correction": None,
                    "confidence": result.get("confidence", 0.9),
                })
            elif status == VerificationStatus.UNVERIFIED:
                findings.append({
                    "finding_type": FindingType.UNVERIFIED_CLAIM,
                    "severity": Severity.MEDIUM,
                    "rule_id": None,
                    "title": "Unverified claim",
                    "excerpt": claim_text[:200],
                    "explanation": result.get("explanation", "No approved evidence found for this claim."),
                    "suggested_correction": None,
                    "confidence": result.get("confidence", 0.7),
                })
            elif status == VerificationStatus.OUTDATED_CONFLICTING:
                findings.append({
                    "finding_type": FindingType.OUTDATED_SOURCE,
                    "severity": Severity.HIGH,
                    "rule_id": None,
                    "title": "Outdated or conflicting source",
                    "excerpt": claim_text[:200],
                    "explanation": result.get("explanation", "Claim matches expired or conflicting sources."),
                    "suggested_correction": None,
                    "confidence": result.get("confidence", 0.8),
                })
        
        return findings

    async def _stage7_generate_corrections(
        self,
        content: str,
        findings: List[Dict],
        claim_results: Dict[str, Dict],
    ) -> str:
        """Generate corrected content using LLM."""
        from app.agents.llm import CorrectionResponse
        
        prompt = format_correction_prompt(content, findings, claim_results)
        
        try:
            result = await self.llm.generate_json(prompt, CorrectionResponse)
            return result.suggested_content
        except Exception as e:
            logger.error("correction_generation_failed", error=str(e))
            return content  # Return original if correction fails

    def _calculate_risk_level(self, findings: List[Dict], claim_results: Dict[str, Dict]) -> RiskLevel:
        """Calculate overall risk level."""
        # HIGH if any CONTRADICTED claims or HIGH severity findings
        for result in claim_results.values():
            if result.get("verification_status") == VerificationStatus.CONTRADICTED:
                return RiskLevel.HIGH
        
        for finding in findings:
            if finding.get("severity") == Severity.HIGH:
                return RiskLevel.HIGH
        
        # MEDIUM if any UNVERIFIED claims or MEDIUM severity findings
        for result in claim_results.values():
            if result.get("verification_status") == VerificationStatus.UNVERIFIED:
                return RiskLevel.MEDIUM
        
        for finding in findings:
            if finding.get("severity") == Severity.MEDIUM:
                return RiskLevel.MEDIUM
        
        return RiskLevel.LOW

    async def _persist_results(
        self,
        org_id: UUID,
        content_id: UUID,
        run_id: UUID,
        claim_results: Dict[str, Dict],
        findings: List[Dict],
        suggested_content: str,
        risk_level: RiskLevel,
    ) -> None:
        """Persist claims, findings, and evidence to database."""
        # Persist claims
        claim_objects = []
        for claim_text, result in claim_results.items():
            claim = Claim(
                org_id=org_id,
                content_id=content_id,
                analysis_run_id=run_id,
                claim_text=claim_text,
                claim_type="FACTUAL_STATEMENT",  # Could be extracted from result
                verification_status=result.get("verification_status"),
                explanation=result.get("explanation", ""),
                confidence=result.get("confidence", 0.5),
                evidence_ids=[],  # Would be populated from evidence
            )
            self.db.add(claim)
            claim_objects.append((claim, result))
        
        await self.db.flush()
        
        # Persist findings
        finding_objects = []
        for finding_data in findings:
            finding = Finding(
                org_id=org_id,
                content_id=content_id,
                analysis_run_id=run_id,
                finding_type=finding_data["finding_type"],
                severity=finding_data["severity"],
                rule_id=finding_data.get("rule_id"),
                title=finding_data["title"],
                excerpt=finding_data["excerpt"],
                explanation=finding_data["explanation"],
                suggested_correction=finding_data.get("suggested_correction"),
                confidence=finding_data["confidence"],
            )
            self.db.add(finding)
            finding_objects.append(finding)
        
        await self.db.flush()
        
        # Persist evidence linking
        for claim_obj, result in claim_objects:
            evidence = result.get("evidence", [])
            for ev in evidence:
                # Find matching fact or chunk
                # This would be more sophisticated in production
                pass
        
        # Log audit event
        audit_service = AuditService(self.db)
        await audit_service.log(
            org_id=org_id,
            user_id=None,
            entity_type="analysis_run",
            entity_id=run_id,
            action="COMPLETED",
            old_value={"status": "RUNNING"},
            new_value={"status": "COMPLETED", "findings": len(findings), "claims": len(claim_results)},
        )


from decimal import Decimal
