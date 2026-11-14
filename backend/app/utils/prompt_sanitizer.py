import re
from typing import List

# Patterns that might indicate prompt injection
INJECTION_PATTERNS = [
    r"ignore\s+previous\s+instructions",
    r"ignore\s+the\s+above",
    r"forget\s+everything",
    r"forget\s+previous",
    r"system\s*:",
    r"assistant\s*:",
    r"user\s*:",
    r"<\|.*?\|>",
    r"\[INST\].*?\[/INST\]",
    r"\[SYSTEM\].*?\[/SYSTEM\]",
    r"\{\{.*?\}\}",
    r"###\s*Instruction",
    r"###\s*System",
    r"new\s+instructions?:",
    r"override\s+instructions?",
    r"disregard\s+previous",
    r"pretend\s+to\s+be",
    r"act\s+as\s+if",
    r"roleplay",
    r"simulate",
]

# Compile patterns
INJECTION_REGEX = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]


def sanitize_prompt(text: str) -> str:
    """Remove potential prompt injection attempts from text."""
    if not text:
        return text

    sanitized = text
    for pattern in INJECTION_REGEX:
        sanitized = pattern.sub("[REDACTED]", sanitized)
    
    return sanitized


def wrap_document_content(text: str) -> str:
    """Wrap document content in clear delimiters to prevent injection."""
    sanitized = sanitize_prompt(text)
    return f"<document_content>\n{sanitized}\n</document_content>"


def is_suspicious(text: str) -> bool:
    """Check if text contains suspicious patterns."""
    if not text:
        return False
    for pattern in INJECTION_REGEX:
        if pattern.search(text):
            return True
    return False


def extract_suspicious_patterns(text: str) -> List[str]:
    """Extract suspicious patterns found in text."""
    found = []
    for pattern in INJECTION_REGEX:
        matches = pattern.findall(text)
        if matches:
            found.extend(matches)
    return found
