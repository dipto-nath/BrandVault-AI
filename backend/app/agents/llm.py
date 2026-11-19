from typing import List, Dict, Any, Type, TypeVar, Optional
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
import json
import structlog

from app.core.config import settings
from app.utils.prompt_sanitizer import wrap_document_content

logger = structlog.get_logger()

T = TypeVar('T', bound=BaseModel)


# Response models for LLM structured output
class ClaimExtractionItem(BaseModel):
    claim_text: str
    claim_type: str = "FACTUAL"
    entity_name: Optional[str] = None
    attribute_name: Optional[str] = None
    normalized_value: Optional[str] = None
    unit: Optional[str] = None
    qualifier: Optional[str] = None
    confidence: float = Field(default=0.9, ge=0, le=1)

class ClaimExtractionResponse(BaseModel):
    claims: List[ClaimExtractionItem]

class DeterministicCheckResponse(BaseModel):
    verification_status: str  # SUPPORTED, CONTRADICTED, UNVERIFIED
    confidence: float = Field(ge=0, le=1)
    explanation: str
    matched_fact_id: str = ""
    matched_fact_text: str = ""

class EvidenceItem(BaseModel):
    source_chunk_id: Optional[str] = None
    source_name: Optional[str] = None
    page: Optional[int] = None
    excerpt: Optional[str] = None
    relation: str = "RELATED"  # SUPPORTS, CONTRADICTS, RELATED

class ContextualVerificationItem(BaseModel):
    claim_text: str
    verification_status: str  # SUPPORTED, CONTRADICTED, UNVERIFIED, OUTDATED_CONFLICTING
    confidence: float = Field(ge=0, le=1)
    explanation: str
    evidence: List[EvidenceItem]

class ContextualVerificationResponse(BaseModel):
    claims: List[ContextualVerificationItem]

class ToneFindingItem(BaseModel):
    type: str
    severity: str
    title: str
    excerpt: str
    explanation: str
    rule_id: str
    suggested_correction: str
    confidence: float = Field(ge=0, le=1)

class ToneAnalysisResponse(BaseModel):
    findings: List[ToneFindingItem]

class CorrectionResponse(BaseModel):
    suggested_content: str
    analysis_notes: str


class LLMProvider(ABC):
    @abstractmethod
    async def generate_json(
        self,
        prompt: str,
        schema: Type[T],
        temperature: float = 0.2,
        max_tokens: int = 2000,
    ) -> T:
        pass

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 2000,
    ) -> str:
        pass


class MockLLMProvider(LLMProvider):
    """Deterministic mock LLM for testing/demo."""
    
    async def generate_json(
        self,
        prompt: str,
        schema: Type[T],
        temperature: float = 0.2,
        max_tokens: int = 2000,
    ) -> T:
        prompt_lower = prompt.lower()
        
        if "extract" in prompt_lower and "claim" in prompt_lower:
            mock_data = {
                "claims": [
                    {
                        "claim_text": "Battery life up to 12 hours",
                        "claim_type": "PRODUCT_SPECIFICATION",
                        "entity_name": "NexaTech Buds X",
                        "attribute_name": "battery_life",
                        "normalized_value": "12",
                        "unit": "hours",
                        "qualifier": "up to",
                        "confidence": 0.95,
                    },
                    {
                        "claim_text": "Bluetooth 5.0",
                        "claim_type": "PRODUCT_SPECIFICATION",
                        "entity_name": "NexaTech Buds X",
                        "attribute_name": "bluetooth_version",
                        "value_text": "5.0",
                        "confidence": 0.95,
                    },
                ]
            }
        elif "verify" in prompt_lower or "classify" in prompt_lower:
            mock_data = {
                "claims": [
                    {
                        "claim_text": "Battery life up to 18 hours",
                        "verification_status": "CONTRADICTED",
                        "confidence": 0.95,
                        "explanation": "Claim states 18 hours but approved fact states up to 12 hours",
                        "evidence": [
                            {
                                "source_name": "Product Spec v4",
                                "page": 3,
                                "excerpt": "battery life up to 12 hours",
                                "relation": "CONTRADICTS",
                            }
                        ],
                    }
                ]
            }
        elif "tone" in prompt_lower or "guideline" in prompt_lower:
            mock_data = {
                "findings": [
                    {
                        "type": "TERMINOLOGY_VIOLATION",
                        "severity": "MEDIUM",
                        "title": "Non-preferred terminology",
                        "excerpt": "AI robot buddy",
                        "explanation": "Use 'smart assistant' instead of 'AI robot buddy'",
                        "rule_id": "RULE-TERM-001",
                        "suggested_correction": "smart assistant",
                        "confidence": 0.97,
                    }
                ]
            }
        elif "correct" in prompt_lower:
            mock_data = {
                "suggested_content": "Experience up to 12 hours of battery life with Bluetooth 5.0, backed by our 2-year warranty.",
                "analysis_notes": "Corrected battery life from 18 to 12 hours, Bluetooth from 5.3 to 5.0, warranty from 5-year to 2-year.",
            }
        else:
            mock_data = {}
        
        return schema(**mock_data)
    
    async def generate_text(
        self,
        prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 2000,
    ) -> str:
        return "Mock response"


class GeminiProvider(LLMProvider):
    """Google Gemini LLM provider."""
    
    def __init__(self):
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        except ImportError:
            raise RuntimeError("google-generativeai package not installed")
    
    async def generate_json(
        self,
        prompt: str,
        schema: Type[T],
        temperature: float = 0.2,
        max_tokens: int = 2000,
    ) -> T:
        schema_dict = schema.model_json_schema()
        full_prompt = f"{prompt}\n\nOutput MUST be valid JSON matching this schema:\n{json.dumps(schema_dict, indent=2)}"
        
        response = await self.model.generate_content_async(
            full_prompt,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_tokens,
                "response_mime_type": "application/json",
            },
        )
        
        try:
            data = json.loads(response.text)
            return schema(**data)
        except json.JSONDecodeError as e:
            logger.error("gemini_json_parse_failed", error=str(e), response=response.text[:500])
            raise ValueError(f"Failed to parse JSON from Gemini: {e}")
    
    async def generate_text(
        self,
        prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 2000,
    ) -> str:
        response = await self.model.generate_content_async(
            prompt,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_tokens,
            },
        )
        return response.text


class OpenAIProvider(LLMProvider):
    """OpenAI LLM provider."""
    
    def __init__(self):
        try:
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI()
        except ImportError:
            raise RuntimeError("openai package not installed")
    
    async def generate_json(
        self,
        prompt: str,
        schema: Type[T],
        temperature: float = 0.2,
        max_tokens: int = 2000,
    ) -> T:
        schema_dict = schema.model_json_schema()
        
        response = await self.client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a brand governance analyst. Output only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            response_format=schema,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        return response.choices[0].message.parsed
    
    async def generate_text(
        self,
        prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 2000,
    ) -> str:
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content


def get_llm_provider() -> LLMProvider:
    """Get configured LLM provider."""
    if settings.USE_MOCK_LLM or not settings.GEMINI_API_KEY:
        logger.info("using_mock_llm_provider")
        return MockLLMProvider()
    
    try:
        return GeminiProvider()
    except Exception as e:
        logger.warning("gemini_init_failed_falling_back_to_mock", error=str(e))
        return MockLLMProvider()
