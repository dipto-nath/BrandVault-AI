from typing import List
from abc import ABC, abstractmethod
import structlog

from app.core.config import settings

logger = structlog.get_logger()


class EmbeddingProvider(ABC):
    @abstractmethod
    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        pass


class MockEmbeddingProvider(EmbeddingProvider):
    """Deterministic mock embeddings for testing."""
    
    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        import hashlib
        embeddings = []
        for text in texts:
            # Create deterministic embedding from text hash
            hash_obj = hashlib.md5(text.encode())
            hash_bytes = hash_obj.digest()
            # Expand to 1536 dimensions
            embedding = []
            for i in range(1536):
                byte_idx = i % len(hash_bytes)
                embedding.append((hash_bytes[byte_idx] / 255.0) * 2 - 1)
            embeddings.append(embedding)
        return embeddings


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI embeddings provider."""
    
    def __init__(self):
        try:
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI()
        except ImportError:
            raise RuntimeError("openai package not installed")
    
    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        response = await self.client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=texts,
            dimensions=settings.EMBEDDING_DIMENSIONS,
        )
        return [d.embedding for d in response.data]


class GeminiEmbeddingProvider(EmbeddingProvider):
    """Gemini embeddings provider."""
    
    def __init__(self):
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.client = genai
        except ImportError:
            raise RuntimeError("google-generativeai package not installed")
    
    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            result = self.client.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document",
            )
            embeddings.append(result["embedding"])
        return embeddings


async def get_embeddings(texts: List[str]) -> List[List[float]]:
    """Get embeddings using configured provider."""
    if settings.USE_MOCK_LLM or not settings.GEMINI_API_KEY:
        provider = MockEmbeddingProvider()
    else:
        try:
            provider = GeminiEmbeddingProvider()
        except:
            provider = MockEmbeddingProvider()
    
    return await provider.get_embeddings(texts)
