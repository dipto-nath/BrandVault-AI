import fitz  # PyMuPDF
import docx
import tiktoken
from typing import List, Dict, Any
import structlog

logger = structlog.get_logger()

# Token encoder for chunking (lazy-loaded with fallback)
_encoder = None


def get_encoder():
    global _encoder
    if _encoder is None:
        try:
            _encoder = tiktoken.get_encoding("cl100k_base")
        except Exception as e:
            logger.warning("tiktoken_encoder_unavailable", error=str(e))
            _encoder = False
    return _encoder if _encoder is not False else None


def count_tokens(text: str) -> int:
    """Count tokens in text."""
    enc = get_encoder()
    if enc:
        try:
            return len(enc.encode(text))
        except Exception:
            pass
    # Resilient fallback: ~4 characters per token
    return max(1, len(text) // 4)


def extract_text_from_pdf(file_path: str) -> tuple[str, int]:
    """Extract text from PDF with page information.
    Returns (full_text, page_count).
    """
    doc = fitz.open(file_path)
    page_count = len(doc)
    full_text = []

    for page_num in range(page_count):
        page = doc[page_num]
        text = page.get_text()
        if text.strip():
            full_text.append(f"[Page {page_num + 1}]\n{text}")

    doc.close()
    return "\n\n".join(full_text), page_count


def extract_text_from_docx(file_path: str) -> tuple[str, int]:
    """Extract text from DOCX.
    Returns (full_text, page_count_estimate).
    """
    doc = docx.Document(file_path)
    full_text = []

    for para in doc.paragraphs:
        if para.text.strip():
            full_text.append(para.text)

    # Estimate pages (roughly 500 words per page)
    word_count = len(" ".join(full_text).split())
    page_count = max(1, word_count // 500)

    return "\n\n".join(full_text), page_count


def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50,
) -> List[Dict[str, Any]]:
    """Split text into overlapping chunks with metadata.
    Returns list of dicts with text, token_count, char positions, page estimates.
    """
    enc = get_encoder()
    if enc:
        tokens = enc.encode(text)
        chunks = []
        
        for i in range(0, len(tokens), chunk_size - overlap):
            chunk_tokens = tokens[i:i + chunk_size]
            chunk_text_val = enc.decode(chunk_tokens)
            
            if len(chunk_text_val.strip()) < 50:  # Skip very small chunks
                continue

            # Estimate character positions
            char_start = len(enc.decode(tokens[:i]))
            char_end = char_start + len(chunk_text_val)
            
            # Estimate page numbers (rough)
            page_start = max(1, char_start // 3000 + 1)
            page_end = max(1, char_end // 3000 + 1)
            
            chunks.append({
                "text": chunk_text_val.strip(),
                "token_count": len(chunk_tokens),
                "char_start": char_start,
                "char_end": char_end,
                "page_start": page_start,
                "page_end": page_end,
            })

            if i + chunk_size >= len(tokens):
                break

        return chunks

    # Fallback word-based chunking if encoder is not available
    words = text.split()
    chunks = []
    word_chunk_size = max(50, chunk_size // 2)
    word_overlap = max(5, overlap // 2)
    step = max(1, word_chunk_size - word_overlap)

    for i in range(0, len(words), step):
        chunk_words = words[i:i + word_chunk_size]
        chunk_text_val = " ".join(chunk_words)
        if len(chunk_text_val.strip()) < 50:
            continue
        chunks.append({
            "text": chunk_text_val.strip(),
            "token_count": len(chunk_words),
            "char_start": i * 5,
            "char_end": (i + len(chunk_words)) * 5,
            "page_start": max(1, i // 400 + 1),
            "page_end": max(1, (i + len(chunk_words)) // 400 + 1),
        })
        if i + word_chunk_size >= len(words):
            break
    return chunks


def sanitize_extracted_text(text: str) -> str:
    """Clean extracted text."""
    # Remove null bytes
    text = text.replace("\u0000", "")
    # Normalize whitespace
    import re
    text = re.sub(r"\s+", " ", text)
    return text.strip()
