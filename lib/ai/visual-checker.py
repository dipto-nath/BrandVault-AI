#!/usr/bin/env python3
"""
BrandVault Visual & Accessibility Engine
Implements OpenCV-backed logo asset matching, WCAG 2.2 contrast measurement,
alt-text compliance checking, OCR text extraction, and claim verification.
"""

import sys
import os
import json
import argparse
import re
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

try:
    import cv2
    from PIL import Image, ImageOps
except ImportError as e:
    print(json.dumps({"error": f"Missing visual dependencies: {e}"}))
    sys.exit(1)

# Try to import pytesseract for OCR
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

# Try to import the claim verification logic
try:
    # We'll implement a simplified deterministic verification here
    CLAIM_VERIFICATION_AVAILABLE = True
except ImportError:
    CLAIM_VERIFICATION_AVAILABLE = False


# WCAG 2.2 Relative Luminance and Contrast Calculation
def linearize_channel(c: int) -> float:
    norm = c / 255.0
    return norm / 12.92 if norm <= 0.04045 else ((norm + 0.055) / 1.055) ** 2.4


def relative_luminance(rgb: Tuple[int, int, int]) -> float:
    r, g, b = [linearize_channel(v) for v in rgb]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def compute_contrast_ratio(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
    lum1 = relative_luminance(rgb1)
    lum2 = relative_luminance(rgb2)
    lighter, darker = max(lum1, lum2), min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)


def hex_to_rgb(hex_code: str) -> Optional[Tuple[int, int, int]]:
    hex_clean = hex_code.lstrip('#')
    if len(hex_clean) == 3:
        hex_clean = ''.join([c * 2 for c in hex_clean])
    if len(hex_clean) != 6:
        return None
    try:
        return (
            int(hex_clean[0:2], 16),
            int(hex_clean[2:4], 16),
            int(hex_clean[4:6], 16)
        )
    except ValueError:
        return None


def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"


# 1. Image Normalization & Security Checks
def normalize_image(file_path: str, max_bytes: int = 10 * 1024 * 1024) -> Tuple[Image.Image, Dict[str, Any]]:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    file_size = os.path.getsize(file_path)
    if file_size > max_bytes:
        raise ValueError(f"Image exceeds size limit of {max_bytes} bytes (got {file_size})")

    # Safe decode & verify
    pil_img = Image.open(file_path)
    pil_img.verify()

    # Re-open for operations
    pil_img = Image.open(file_path)
    pil_img = ImageOps.exif_transpose(pil_img)

    w, h = pil_img.size
    if w > 4096 or h > 4096:
        pil_img.thumbnail((4096, 4096), Image.Resampling.LANCZOS)
        w, h = pil_img.size

    metadata = {
        "filename": os.path.basename(file_path),
        "mimeType": Image.MIME.get(pil_img.format, "image/png"),
        "byteSize": file_size,
        "width": w,
        "height": h,
        "format": pil_img.format
    }
    return pil_img, metadata


# 2. Approved Brand Asset Matching using OpenCV
def match_approved_assets(upload_path: str, approved_dir: str) -> List[Dict[str, Any]]:
    findings = []
    
    # Asset Library Definition (from blueprint specification)
    # nextech-logo-v4 is APPROVED and active
    # nextech-logo-v2 is OUTDATED / EXPIRED on 2025-12-31
    asset_registry = [
        {
            "assetId": "nextech-logo-primary",
            "version": "v4",
            "filename": "nextech-logo-v4.png",
            "status": "APPROVED",
            "validFrom": "2026-01-01T00:00:00Z",
            "validTo": None,
            "isCurrent": True
        },
        {
            "assetId": "nextech-logo-primary",
            "version": "v2",
            "filename": "nextech-logo-v2.png",
            "status": "EXPIRED",
            "validFrom": "2023-01-01T00:00:00Z",
            "validTo": "2025-12-31T23:59:59Z",
            "isCurrent": False
        }
    ]

    img_gray = cv2.imread(upload_path, cv2.IMREAD_GRAYSCALE)
    if img_gray is None:
        return findings

    best_match = None
    best_score = -1.0
    best_inliers = 0
    best_good = 0

    orb = cv2.ORB_create(nfeatures=2500)
    kp_upload, des_upload = orb.detectAndCompute(img_gray, None)

    for asset in asset_registry:
        asset_path = os.path.join(approved_dir, asset["filename"])
        if not os.path.exists(asset_path):
            continue

        tpl_gray = cv2.imread(asset_path, cv2.IMREAD_GRAYSCALE)
        if tpl_gray is None:
            continue

        # Multi-scale template matching
        max_corr = 0.0
        for scale in np.linspace(0.4, 1.4, 11):
            h_t, w_t = tpl_gray.shape
            scaled_w, scaled_h = int(w_t * scale), int(h_t * scale)
            if scaled_w > img_gray.shape[1] or scaled_h > img_gray.shape[0]:
                continue
            resized = cv2.resize(tpl_gray, (scaled_w, scaled_h))
            res = cv2.matchTemplate(img_gray, resized, cv2.TM_CCOEFF_NORMED)
            _, max_val, _, _ = cv2.minMaxLoc(res)
            if max_val > max_corr:
                max_corr = max_val

        # ORB feature matching
        inliers = 0
        good_len = 0
        if des_upload is not None:
            kp_tpl, des_tpl = orb.detectAndCompute(tpl_gray, None)
            if des_tpl is not None:
                matcher = cv2.BFMatcher(cv2.NORM_HAMMING)
                pairs = matcher.knnMatch(des_upload, des_tpl, k=2)
                good = [m for m, n in pairs if len(pairs) > 1 and m.distance < 0.75 * n.distance]
                good_len = len(good)
                if good_len >= 4:
                    src = np.float32([kp_upload[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
                    dst = np.float32([kp_tpl[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
                    _, mask = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
                    inliers = int(mask.sum()) if mask is not None else 0

        # Composite score
        composite = max_corr * 0.7 + (min(inliers, 100) / 100.0) * 0.3

        if composite > best_score:
            best_score = composite
            best_match = asset
            best_inliers = inliers
            best_good = good_len

    # If confidence exceeds threshold (> 0.65)
    if best_match and best_score >= 0.65:
        if not best_match["isCurrent"]:
            # Mismatch: Outdated logo detected
            findings.append({
                "type": "ASSET_MISMATCH",
                "severity": "HIGH",
                "ruleId": "RULE-VISUAL-001",
                "title": "Outdated approved logo",
                "message": f"Uploaded creative contains an outdated version ({best_match['version']}) of the NexTech brand mark.",
                "originalPhrase": f"NexTech Brand Mark {best_match['version']}",
                "suggestedCorrection": "Replace with current approved logo version v4 (effective 2026-01-01).",
                "confidence": round(float(best_score), 2),
                "evidence": {
                    "assetId": best_match["assetId"],
                    "matchedVersion": best_match["version"],
                    "expectedVersion": "v4",
                    "validityInterval": f"{best_match['validFrom']} to {best_match['validTo']}",
                    "goodMatches": best_good,
                    "inlierMatches": best_inliers,
                    "referenceImageKey": f"approved_assets/{best_match['filename']}",
                    "confidenceScore": round(float(best_score), 2)
                }
            })
        else:
            # Active approved logo matched
            pass

    return findings


# 3. WCAG 2.2 Text Contrast Analysis
def analyze_contrast(
    upload_path: str,
    manual_fg: Optional[str] = None,
    manual_bg: Optional[str] = None,
    is_large_text: bool = False
) -> Tuple[float, Tuple[int, int, int], Tuple[int, int, int], List[Dict[str, Any]]]:
    findings = []
    
    fg_rgb = hex_to_rgb(manual_fg) if manual_fg else None
    bg_rgb = hex_to_rgb(manual_bg) if manual_bg else None

    img = cv2.imread(upload_path)
    if img is not None and (fg_rgb is None or bg_rgb is None):
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w, _ = img.shape
        
        # Estimate background from corners/borders
        corners = np.vstack([
            img_rgb[0:15, 0:15].reshape(-1, 3),
            img_rgb[0:15, w-15:w].reshape(-1, 3),
            img_rgb[h-15:h, 0:15].reshape(-1, 3),
            img_rgb[h-15:h, w-15:w].reshape(-1, 3),
        ])
        auto_bg = tuple(map(int, np.median(corners, axis=0)))
        if bg_rgb is None:
            bg_rgb = auto_bg

        # Estimate text foreground from edge regions
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 40, 140)
        edge_pixels = img_rgb[edges > 0]
        if len(edge_pixels) > 0 and fg_rgb is None:
            diffs = np.linalg.norm(edge_pixels.astype(float) - np.array(bg_rgb), axis=1)
            # Pick prominent foreground color at 75th percentile of contrast
            idx = np.argsort(diffs)[int(len(diffs) * 0.75)]
            fg_rgb = tuple(map(int, edge_pixels[idx]))
        elif fg_rgb is None:
            fg_rgb = (15, 23, 42)

    if fg_rgb is None:
        fg_rgb = (15, 23, 42)
    if bg_rgb is None:
        bg_rgb = (245, 245, 245)

    ratio = compute_contrast_ratio(fg_rgb, bg_rgb)
    threshold = 3.0 if is_large_text else 4.5

    if ratio < threshold:
        findings.append({
            "type": "LOW_CONTRAST",
            "severity": "HIGH",
            "ruleId": "RULE-A11Y-002",
            "title": "Banner text contrast is too low",
            "message": f"Measured text contrast ratio is {ratio:.1f}:1, failing WCAG 2.2 AA requirement of {threshold}:1.",
            "originalPhrase": f"Banner Headline Text ({ratio:.1f}:1 contrast)",
            "suggestedCorrection": f"Increase text contrast to at least {threshold}:1 by darkening text or brightening background.",
            "confidence": 0.98,
            "evidence": {
                "ratio": round(ratio, 2),
                "required": threshold,
                "textCategory": "Large Text (≥18pt)" if is_large_text else "Normal Body Text",
                "foreground": rgb_to_hex(fg_rgb),
                "background": rgb_to_hex(bg_rgb),
                "standard": "WCAG 2.2 AA §1.4.3"
            }
        })

    return ratio, fg_rgb, bg_rgb, findings


# 4. Alt-Text Accessibility Check
def check_alt_text(alt_text: Optional[str], is_decorative: bool, channel: str) -> List[Dict[str, Any]]:
    findings = []
    digital_channels = {"WEBSITE", "INSTAGRAM", "LINKEDIN", "EMAIL", "FACEBOOK", "TWITTER"}
    if channel.upper() not in digital_channels:
        return findings

    if is_decorative or (alt_text is not None and alt_text.strip() == '""'):
        # Valid decorative image with intentionally empty alt
        return findings

    if not alt_text or not alt_text.strip():
        findings.append({
            "type": "MISSING_ALT_TEXT",
            "severity": "MEDIUM",
            "ruleId": "RULE-A11Y-001",
            "title": "Missing image alt text",
            "message": "Creative published on digital/web channels must include descriptive alt text for assistive screen readers.",
            "originalPhrase": "Uploaded Creative Image",
            "suggestedCorrection": "Add concise descriptive alternative text describing the product and key visual messaging.",
            "confidence": 1.0,
            "evidence": {
                "channel": channel,
                "altAttributePresent": False,
                "isDecorative": False,
                "standard": "WCAG 2.2 AA §1.1.1 Non-text Content"
            }
        })

    return findings


# 5. OCR Text Extraction
def extract_text_from_image(image_path: str) -> Tuple[str, Dict[str, Any]]:
    """Extract text from image using OCR."""
    ocr_metadata = {
        "ocrAvailable": TESSERACT_AVAILABLE,
        "engine": "tesseract" if TESSERACT_AVAILABLE else "none",
        "textExtracted": False,
        "characterCount": 0,
        "wordCount": 0,
    }
    
    if not TESSERACT_AVAILABLE:
        return "", ocr_metadata
    
    try:
        cv_img = cv2.imread(image_path)
        if cv_img is None:
            return "", ocr_metadata
        
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        denoised = cv2.fastNlMeansDenoising(thresh, h=10)
        
        custom_config = r'--oem 3 --psm 6 -l eng'
        text = pytesseract.image_to_string(denoised, config=custom_config)
        
        text = text.strip()
        text = re.sub(r'\n+', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        
        ocr_metadata["textExtracted"] = True
        ocr_metadata["characterCount"] = len(text)
        ocr_metadata["wordCount"] = len(text.split()) if text else 0
        
        return text, ocr_metadata
        
    except Exception as e:
        ocr_metadata["error"] = str(e)
        return "", ocr_metadata



# 6. Deterministic Claim Extraction
def extract_claims_from_text(text: str) -> List[Dict[str, Any]]:
    """Extract atomic factual claims from text content."""
    if not text or len(text) < 10:
        return []
    
    claims = []
    text_lower = text.lower()
    
    clauses = re.split(r'(?<=[.!?])\s+|;\s+|,\s+(?=(?:weighing|crafted|featuring|with|available|scheduled|get ready|ready to enjoy))|,\s*(?=and)|,\s*/i', text)
    clauses = [c.strip() for c in clauses if len(c.strip()) > 3]
    
    for clause in clauses:
        lower = clause.lower()
        claim_type = None
        
        if re.search(r'(battery|hours?\s+of\s+battery|battery\s+backup|mixed.use|mixed.use)', lower):
            claim_type = 'PRODUCT_SPECIFICATION'
        elif re.search(r'(screen|display|inch|"|retina|resolution)', lower):
            claim_type = 'PRODUCT_SPECIFICATION'
        elif re.search(r'(weigh|weight|185\s*g|gram)', lower):
            claim_type = 'PRODUCT_SPECIFICATION'
        elif re.search(r'(waterproof|water.resist|IP68|water.resistant)', lower):
            claim_type = 'PRODUCT_SPECIFICATION'
        elif re.search(r'(aluminium|aluminum|chassis|materials?|recycled)', lower):
            claim_type = 'PRODUCT_SPECIFICATION'
        elif re.search(r'(launch|december\s+2026|available|release)', lower):
            claim_type = 'PRODUCT_SPECIFICATION'
        elif re.search(r'(get ready|ready to enjoy|enjoy)', lower):
            claim_type = 'PROMOTIONAL_CLAIM'
        elif re.search(r'(robot\s+buddy|smart\s+assistant|AI\s+robot)', lower):
            claim_type = 'PRODUCT_SPECIFICATION'
        elif re.search(r'(quantum|ultra.conductive|revolutionary|ultimate|flawless|miraculous)', lower):
            claim_type = 'PROMOTIONAL_CLAIM'
        elif re.search(r'\d', clause) and any(kw in lower for kw in ['hour', 'battery', 'weight', 'screen', 'inch', 'gram', 'launch', 'waterproof', 'material']):
            claim_type = 'PRODUCT_SPECIFICATION'
        
        if claim_type:
            claims.append({
                "claimText": clause,
                "claimType": claim_type,
            })
    
    return claims


# 7. Approved Facts Database
APPROVED_FACTS = [
    {
        "id": "FACT-001",
        "code": "FACT-001",
        "title": "Battery life",
        "text": "NexTech Nova delivers up to 24 hours of battery life under standard test conditions.",
        "category": "PRODUCT_SPECIFICATION",
    },
    {
        "id": "FACT-002",
        "code": "FACT-002",
        "title": "Device weight",
        "text": "NexTech Nova weighs 185 grams.",
        "category": "PRODUCT_SPECIFICATION",
    },
    {
        "id": "FACT-003",
        "code": "FACT-003",
        "title": "Materials",
        "text": "The NexTech Nova chassis uses recycled aluminium.",
        "category": "PRODUCT_SPECIFICATION",
    },
    {
        "id": "FACT-004",
        "code": "FACT-004",
        "title": "Waterproofing",
        "text": "No approved waterproof rating is currently documented for NexTech Nova.",
        "category": "PRODUCT_SPECIFICATION",
    },
    {
        "id": "FACT-005",
        "code": "FACT-005",
        "title": "Launch date",
        "text": "The NexTech Nova launch is scheduled for 15 December 2026.",
        "category": "PRODUCT_SPECIFICATION",
    },
    {
        "id": "FACT-006",
        "code": "FACT-006",
        "title": "Screen",
        "text": "NexTech Nova features a 6.7-inch display.",
        "category": "PRODUCT_SPECIFICATION",
    },
    {
        "id": "FACT-007",
        "code": "FACT-007",
        "title": "AI features",
        "text": "NexTech Nova includes an AI smart assistant.",
        "category": "PRODUCT_SPECIFICATION",
    },
]


def retrieve_evidence_for_claim(claim_text: str) -> List[Dict[str, Any]]:
    """Find approved facts that relate to the claim."""
    evidence = []
    claim_lower = claim_text.lower()
    
    for fact in APPROVED_FACTS:
        fact_lower = fact["text"].lower()
        
        claim_keywords = set(re.findall(r'\w{4,}', claim_lower))
        fact_keywords = set(re.findall(r'\w{4,}', fact_lower))
        
        overlap = claim_keywords & fact_keywords
        if len(overlap) >= 2:
            evidence.append(fact)
    
    return evidence


def verify_claim_deterministic(claim_text: str, evidence: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Deterministically verify a claim against approved evidence."""
    claim_lower = claim_text.lower()
    
    if not evidence:
        is_waterproof = bool(re.search(r'waterproof', claim_lower))
        is_superlative = bool(re.search(r'(best|fastest|world'?s\s+(?:best|first|fastest)|unmatched|#1|number\s+one|incredible|completely\s+waterproof|revolutionary|ultimate|flawless|miraculous)', claim_lower))
        
        return {
            "status": "UNVERIFIED",
            "explanation": "No approved evidence found to verify or refute this claim.",
            "evidenceIds": [],
            "confidence": 0.7,
            "findingType": "UNVERIFIED_CLAIM",
            "severity": "HIGH" if is_waterproof else "MEDIUM",
        }
    
    for fact in evidence:
        fact_text = fact["text"].lower()
        
        if "battery" in claim_lower and "battery" in fact_text:
            claim_hours = re.findall(r'(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)', claim_lower)
            fact_hours = re.findall(r'(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)', fact_text)
            
            if claim_hours and fact_hours:
                claim_val = float(claim_hours[0])
                fact_val = float(fact_hours[0])
                
                if claim_val > fact_val * 1.1:
                    return {
                        "status": "CONTRADICTED",
                        "explanation": f"Approved spec states {fact['text']}",
                        "evidenceIds": [fact["id"]],
                        "confidence": 0.95,
                        "findingType": "FACTUAL_CONTRADICTION",
                        "severity": "HIGH",
                    }
        
        if "weigh" in claim_lower or "weight" in claim_lower or "gram" in claim_lower or "185" in claim_text:
            if "weigh" in fact_text or "weight" in fact_text or "185" in fact_text:
                claim_weight = re.findall(r'(\d+(?:\.\d+)?)\s*(?:grams?|g|kg)', claim_lower)
                fact_weight = re.findall(r'(\d+(?:\.\d+)?)\s*(?:grams?|g|kg)', fact_text)
                
                if claim_weight and fact_weight:
                    claim_val = float(claim_weight[0])
                    fact_val = float(fact_weight[0])
                    
                    if abs(claim_val - fact_val) > 5:
                        return {
                            "status": "CONTRADICTED",
                            "explanation": f"Approved spec states {fact['text']}",
                            "evidenceIds": [fact["id"]],
                            "confidence": 0.95,
                            "findingType": "FACTUAL_CONTRADICTION",
                            "severity": "HIGH",
                        }
        
        if "waterproof" in claim_lower or "water.resist" in claim_lower or "IP68" in claim_text.upper():
            if "waterproof" in fact_text and "no approved waterproof" in fact_text:
                return {
                    "status": "CONTRADICTED",
                    "explanation": f"Approved fact states: {fact['text']}",
                    "evidenceIds": [fact["id"]],
                    "confidence": 0.98,
                    "findingType": "FACTUAL_CONTRADICTION",
                    "severity": "HIGH",
                }
        
        if "inch" in claim_lower or "screen" in claim_lower or "display" in claim_lower:
            if "inch" in fact_text or "display" in fact_text:
                claim_inch = re.findall(r'(\d+(?:\.\d+)?)\s*inch', claim_lower)
                fact_inch = re.findall(r'(\d+(?:\.\d+)?)\s*inch', fact_text)
                
                if claim_inch and fact_inch:
                    claim_val = float(claim_inch[0])
                    fact_val = float(fact_inch[0])
                    
                    if abs(claim_val - fact_val) > 0.5:
                        return {
                            "status": "CONTRADICTED",
                            "explanation": f"Approved spec states {fact['text']}",
                            "evidenceIds": [fact["id"]],
                            "confidence": 0.95,
                            "findingType": "FACTUAL_CONTRADICTION",
                            "severity": "HIGH",
                        }
        
        if "launch" in claim_lower or "december" in claim_lower or "2026" in claim_text:
            if "launch" in fact_text and "december" in fact_text:
                return {
                    "status": "SUPPORTED" if "15 december 2026" in claim_lower else "CONTRADICTED",
                    "explanation": f"Approved launch plan states {fact['text']}",
                    "evidenceIds": [fact["id"]],
                    "confidence": 0.95,
                    "findingType": "FACTUAL_CONTRADICTION" if "15 december 2026" not in claim_lower else "SUPPORTED",
                    "severity": "HIGH",
                }
    
    return {
        "status": "SUPPORTED",
        "explanation": f"Claim is consistent with approved fact: {evidence[0]['text']}",
        "evidenceIds": [e["id"] for e in evidence],
        "confidence": 0.9,
        "findingType": "SUPPORTED",
        "severity": "LOW",
    }


def verify_claims_in_text(text: str) -> List[Dict[str, Any]]:
    """Extract claims from text and verify each against approved facts."""
    if not text or len(text) < 10:
        return []
    
    claims = extract_claims_from_text(text)
    findings = []
    
    for claim in claims:
        claim_text = claim["claimText"]
        evidence = retrieve_evidence_for_claim(claim_text)
        verification = verify_claim_deterministic(claim_text, evidence)
        
        if verification["status"] != "SUPPORTED":
            finding = {
                "type": verification.get("findingType", "UNVERIFIED_CLAIM"),
                "severity": verification.get("severity", "MEDIUM"),
                "ruleId": "RULE-CLAIM-001" if verification["status"] == "CONTRADICTED" else "RULE-CLAIM-002",
                "title": "Factual claim contradicted" if verification["status"] == "CONTRADICTED" else "Unverified claim",
                "message": verification["explanation"],
                "originalPhrase": claim_text,
                "suggestedCorrection": "Revise claim to match approved specifications." if verification["status"] == "CONTRADICTED" else "Add supporting evidence or remove unverified claim.",
                "confidence": verification["confidence"],
                "evidence": {
                    "claimText": claim_text,
                    "claimType": claim["claimType"],
                    "verificationStatus": verification["status"],
                    "evidenceIds": verification["evidenceIds"],
                    "matchedFacts": [e["text"] for e in evidence],
                }
            }
            findings.append(finding)
    
    return findings


def main():
    parser = argparse.ArgumentParser(description="BrandVault Visual & Accessibility Engine")
    parser.add_argument("--image", required=True, help="Path to input image file")
    parser.add_argument("--alt", default=None, help="Intended alt text")
    parser.add_argument("--decorative", action="store_true", help="Image is decorative (alt='')")
    parser.add_argument("--channel", default="WEBSITE", help="Content distribution channel")
    parser.add_argument("--fg", default=None, help="Foreground text color (hex)")
    parser.add_argument("--bg", default=None, help="Background banner color (hex)")
    parser.add_argument("--large-text", action="store_true", help="Text is large (≥18pt or 14pt bold)")
    parser.add_argument("--approved-dir", default=".brandvault/approved_assets", help="Approved assets directory")
    args = parser.parse_args()

    try:
        _, metadata = normalize_image(args.image)
        
        # Run parallel checks
        asset_findings = match_approved_assets(args.image, args.approved_dir)
        contrast_ratio, fg_rgb, bg_rgb, contrast_findings = analyze_contrast(
            args.image, args.fg, args.bg, args.large_text
        )
        alt_findings = check_alt_text(args.alt, args.decorative, args.channel)
        
        # OCR Text Extraction
        extracted_text, ocr_metadata = extract_text_from_image(args.image)
        
        # Claim Verification on extracted text
        claim_findings = []
        if extracted_text:
            claim_findings = verify_claims_in_text(extracted_text)

        all_findings = asset_findings + contrast_findings + alt_findings + claim_findings

        result = {
            "status": "complete",
            "image": {
                **metadata,
                "contrast": {
                    "ratio": round(contrast_ratio, 2),
                    "foreground": rgb_to_hex(fg_rgb),
                    "background": rgb_to_hex(bg_rgb),
                    "passesAA": contrast_ratio >= (3.0 if args.large_text else 4.5)
                },
                "altText": {
                    "provided": args.alt,
                    "isDecorative": args.decorative,
                    "compliant": len(alt_findings) == 0
                },
                "ocr": ocr_metadata,
                "extractedText": extracted_text[:500] if extracted_text else None  # Truncate for output
            },
            "findings": all_findings,
            "metrics": {
                "totalChecks": 4,
                "findingsCount": len(all_findings),
                "assetCheck": "mismatch" if any(f["type"] == "ASSET_MISMATCH" for f in all_findings) else "pass",
                "contrastCheck": "fail" if any(f["type"] == "LOW_CONTRAST" for f in all_findings) else "pass",
                "altTextCheck": "fail" if any(f["type"] == "MISSING_ALT_TEXT" for f in all_findings) else "pass",
                "claimCheck": "fail" if any(f["type"] in ["FACTUAL_CONTRADICTION", "UNVERIFIED_CLAIM"] for f in all_findings) else "pass"
            }
        }
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e), "status": "failed"}, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
