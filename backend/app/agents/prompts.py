from app.utils.prompt_sanitizer import wrap_document_content

# System prompt for all agents
SYSTEM_PROMPT = """You are a brand governance analyst for an organization. Your job is to review marketing and brand content against the organization's approved knowledge and brand guidelines. You do not write content. You identify problems, cite evidence, and explain findings with traceable sources. Be precise, cautious, and never fabricate evidence. If evidence is missing, say so. Never treat missing evidence as proof that a claim is false."""


CLAIM_EXTRACTION_PROMPT = """{system_prompt}

TASK: Extract atomic factual claims from the content below.

Rules:
- Identify only factual, verifiable statements: product specifications, quantified statements, comparisons, performance claims, guarantees, launch dates, materials, statistics.
- Do NOT treat opinions, subjective praise, calls to action, or general marketing fluff as factual claims.
- Each claim must be atomic (one fact per claim).
- For each claim, identify: the exact claim text, claim type (PRODUCT_SPECIFICATION, COMPARATIVE_CLAIM, PROMOTIONAL_CLAIM, FACTUAL_STATEMENT, OTHER), entity name, attribute name, normalized numeric value, unit, and qualifier (up to, minimum, exactly, approximately).
- Return JSON only matching the schema.

Content:
"{content}"

Context:
- Product: {product_context}
- Campaign: {campaign_context}
- Locale: {locale}

Output JSON schema:
{{
    "claims": [
        {{
            "claim_text": "string",
            "claim_type": "string",
            "entity_name": "string",
            "attribute_name": "string",
            "normalized_value": "string",
            "unit": "string",
            "qualifier": "string",
            "confidence": 0.0
        }}
    ]
}}"""


DETERMINISTIC_CHECK_PROMPT = """{system_prompt}

TASK: Check if the claim can be verified against the approved facts below using exact matching.

Approved Facts:
{approved_facts_json}

Claim to check:
- Claim: {claim_text}
- Entity: {entity_name}
- Attribute: {attribute_name}
- Value: {normalized_value} {unit}
- Qualifier: {qualifier}

Rules:
- Match by entity_name AND attribute_name
- Compare normalized values with unit conversion
- Handle qualifiers: "up to X" contradicts fact Y if X > Y; "minimum X" contradicts if X < Y
- If exact match found, return SUPPORTED or CONTRADICTED with explanation
- If no exact match, return UNVERIFIED
- Return JSON only.

Output JSON schema:
{{
    "verification_status": "SUPPORTED|CONTRADICTED|UNVERIFIED",
    "confidence": 0.0,
    "explanation": "string",
    "matched_fact_id": "string",
    "matched_fact_text": "string"
}}"""


CONTEXTUAL_VERIFICATION_PROMPT = """{system_prompt}

TASK: Classify the claim using ONLY the retrieved approved source chunks below.

Definitions:
- SUPPORTED: approved evidence confirms the claim
- CONTRADICTED: an approved source explicitly conflicts with the claim
- UNVERIFIED: no sufficient approved evidence exists to establish the claim (NOT proof of falsehood)
- OUTDATED_CONFLICTING: only match is expired/superseded OR approved sources disagree

Retrieved Source Chunks:
{source_chunks_json}

Claim to verify:
- Claim: {claim_text}
- Entity: {entity_name}
- Attribute: {attribute_name}
- Value: {normalized_value} {unit}
- Qualifier: {qualifier}
- Claim Type: {claim_type}

For each claim, find the matching evidence (by entity and subject) and classify it.
Return JSON only matching the schema.

Output JSON schema:
{{
    "claims": [
        {{
            "claim_text": "string",
            "verification_status": "SUPPORTED|CONTRADICTED|UNVERIFIED|OUTDATED_CONFLICTING",
            "confidence": 0.0,
            "explanation": "string",
            "evidence": [
                {{
                    "source_chunk_id": "string",
                    "source_name": "string",
                    "page": 0,
                    "excerpt": "string",
                    "relation": "SUPPORTS|CONTRADICTS|RELATED"
                }}
            ]
        }}
    ]
}}"""


TONE_ANALYSIS_PROMPT = """{system_prompt}

TASK: Analyze the tone and language of the content against the active brand guidelines below. Do not flag a different writing style as a violation; only flag real conflicts with the published guidelines.

Guidelines:
{guidelines_json}

Content:
"{content}"

Return JSON only matching the schema.

Output JSON schema:
{{
    "findings": [
        {{
            "type": "TONE_VIOLATION|TERMINOLOGY_VIOLATION|GUIDELINE_VIOLATION|OTHER",
            "severity": "LOW|MEDIUM|HIGH",
            "title": "string",
            "excerpt": "string",
            "explanation": "string",
            "rule_id": "string",
            "suggested_correction": "string",
            "confidence": 0.0
        }}
    ]
}}"""


GUIDELINE_CHECK_PROMPT = """{system_prompt}

TASK: Check the content against the specific guideline rules below using pattern matching.

Guideline Rules:
{guidelines_json}

Content:
"{content}"

For each guideline with a pattern, check if the pattern matches in the content. Return findings for each match.
Return JSON only matching the schema.

Output JSON schema:
{{
    "findings": [
        {{
            "type": "TERMINOLOGY_VIOLATION|TONE_VIOLATION|GUIDELINE_VIOLATION",
            "severity": "LOW|MEDIUM|HIGH",
            "title": "string",
            "excerpt": "string",
            "explanation": "string",
            "rule_id": "string",
            "suggested_correction": "string",
            "confidence": 0.0
        }}
    ]
}}"""


CORRECTION_PROMPT = """{system_prompt}

TASK: Produce a revised version of the content that resolves the findings and claim classifications below.

Rules:
- Preserve the author's intent and voice where possible.
- Correct contradicted claims using the evidence.
- Remove or qualify unverified statements.
- Use approved terminology.
- Do not introduce new unsupported claims.
- Return only the revised content text.

Original content:
"{content}"

Findings:
{findings_json}

Claims:
{claims_json}

Output JSON schema:
{{
    "suggested_content": "string",
    "analysis_notes": "string"
}}"""


def format_claim_extraction_prompt(content: str, product_context: str = "", campaign_context: str = "", locale: str = "en") -> str:
    return CLAIM_EXTRACTION_PROMPT.format(
        system_prompt=SYSTEM_PROMPT,
        content=content,
        product_context=product_context or "Not specified",
        campaign_context=campaign_context or "Not specified",
        locale=locale,
    )


def format_deterministic_check_prompt(
    claim_text: str,
    entity_name: str,
    attribute_name: str,
    normalized_value: str,
    unit: str,
    qualifier: str,
    approved_facts: list,
) -> str:
    import json
    return DETERMINISTIC_CHECK_PROMPT.format(
        system_prompt=SYSTEM_PROMPT,
        claim_text=claim_text,
        entity_name=entity_name,
        attribute_name=attribute_name,
        normalized_value=normalized_value,
        unit=unit,
        qualifier=qualifier or "none",
        approved_facts_json=json.dumps(approved_facts, indent=2, default=str),
    )


def format_contextual_verification_prompt(
    claim_text: str,
    entity_name: str,
    attribute_name: str,
    normalized_value: str,
    unit: str,
    qualifier: str,
    claim_type: str,
    source_chunks: list,
) -> str:
    import json
    return CONTEXTUAL_VERIFICATION_PROMPT.format(
        system_prompt=SYSTEM_PROMPT,
        claim_text=claim_text,
        entity_name=entity_name,
        attribute_name=attribute_name,
        normalized_value=normalized_value,
        unit=unit,
        qualifier=qualifier or "none",
        claim_type=claim_type,
        source_chunks_json=json.dumps(source_chunks, indent=2, default=str),
    )


def format_tone_analysis_prompt(content: str, guidelines: list) -> str:
    import json
    return TONE_ANALYSIS_PROMPT.format(
        system_prompt=SYSTEM_PROMPT,
        content=content,
        guidelines_json=json.dumps(guidelines, indent=2, default=str),
    )


def format_guideline_check_prompt(content: str, guidelines: list) -> str:
    import json
    return GUIDELINE_CHECK_PROMPT.format(
        system_prompt=SYSTEM_PROMPT,
        content=content,
        guidelines_json=json.dumps(guidelines, indent=2, default=str),
    )


def format_correction_prompt(content: str, findings: list, claims: list) -> str:
    import json
    return CORRECTION_PROMPT.format(
        system_prompt=SYSTEM_PROMPT,
        content=content,
        findings_json=json.dumps(findings, indent=2, default=str),
        claims_json=json.dumps(claims, indent=2, default=str),
    )
