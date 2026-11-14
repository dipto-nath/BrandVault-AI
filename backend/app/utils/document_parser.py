import fitz  # PyMuPDF
import docx
import tiktoken
from typing import List, Dict, Any
import structlog

logger = structlog.get_logger()

# Token encoder for chunking
encoder = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    """Count tokens in text."""
    return len(encoder.encode(text))


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
    tokens = encoder.encode(text)
    chunks = []
    
    for i in range(0, len(tokens), chunk_size - overlap):
        chunk_tokens = tokens[i:i + chunk_size]
        chunk_text = encoder.decode(chunk_tokens)
        
        if len(chunk_text.strip()) < 50:  # Skip very small chunks
            continue

        # Estimate character positions
        char_start = len(encoder.decode(tokens[:i]))
        char_end = char_start + len(chunk_text)
        
        # Estimate page numbers (rough)
        page_start = max(1, char_start // 3000 + 1)
        page_end = max(1, char_end // 3000 + 1)
        
        chunks.append({
            "text": chunk_text.strip(),
            "token_count": len(chunk_tokens),
            "char_start": char_start,
            "char_end": char_end,
            "page_start": page_start,
            "page_end": page_end,
        })

        if i + chunk_size >= len(tokens):
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
