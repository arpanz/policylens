"""Constants for chunking, retrieval, and clause detection."""

from typing import Dict, List

# per clause-type chunk sizes (target/max tokens + overlap)
CHUNK_TOKEN_SIZES: Dict[str, Dict[str, int]] = {
    "coverage": {"target": 512, "max": 768, "overlap": 64},
    "exclusion": {"target": 384, "max": 512, "overlap": 64},
    "definition": {"target": 256, "max": 384, "overlap": 32},
    "deductible": {"target": 384, "max": 512, "overlap": 64},
    "limit": {"target": 384, "max": 512, "overlap": 64},
    "endorsement": {"target": 512, "max": 768, "overlap": 64},
    "schedule": {"target": 512, "max": 1024, "overlap": 0},
    "general_condition": {"target": 512, "max": 768, "overlap": 64},
    "unknown": {"target": 512, "max": 768, "overlap": 64},
}

# regex for top-level section headings (PART/SECTION/ARTICLE/CHAPTER)
SECTION_PATTERNS: List[str] = [
    r"(?i)^PART\s+[IVXLCDM\d]+",
    r"(?i)^SECTION\s+[IVXLCDM\d]+",
    r"(?i)^ARTICLE\s+[IVXLCDM\d]+",
    r"(?i)^CHAPTER\s+[IVXLCDM\d]+",
]

# sub-clause markers like 3.1, (a), (i) etc
CLAUSE_PATTERNS: List[str] = [
    r"^\d+\.\d+",
    r"^\(\d+\)",
    r"^\([a-z]\)",
    r"^\([ivxlcdm]+\)",
    r"^[A-Z]\.",
]

# keywords to detect what type of clause a section is
CLAUSE_TYPE_KEYWORDS: Dict[str, List[str]] = {
    "coverage": [
        "coverage", "covers", "covered", "insured", "protection", "benefit",
        "indemnity", "compensation", "scope of cover",
    ],
    "exclusion": [
        "exclud", "exclus", "not covered", "not payable", "exception",
        "does not apply", "shall not", "war", "nuclear",
    ],
    "definition": [
        "definition", "defined", "means", "defined as", "refers to",
        "interpretation", "hereinafter", "glossary",
    ],
    "deductible": [
        "deductible", "excess", "self-insured", "retention",
        "first amount payable",
    ],
    "limit": [
        "limit", "maximum", "sum insured", "aggregate",
        "sub-limit", "cap", "ceiling",
    ],
    "endorsement": [
        "endorsement", "rider", "addendum", "amendment",
        "supplementary", "modification",
    ],
    "schedule": [
        "schedule", "table of benefits", "annexure", "appendix",
        "premium table",
    ],
    "general_condition": [
        "condition", "obligation", "duty", "warranty",
        "requirement", "clause", "provision",
    ],
}

# maps coverage categories to their keywords for tagging
COVERAGE_CATEGORIES: Dict[str, List[str]] = {
    "fire": [
        "fire", "lightning", "explosion", "implosion",
        "combustion", "smoke damage",
    ],
    "flood": [
        "flood", "inundation", "storm", "tempest",
        "water damage", "cyclone", "hurricane",
    ],
    "theft": [
        "theft", "burglary", "robbery", "housebreaking",
        "larceny", "stealing",
    ],
    "liability": [
        "liability", "third party", "negligence", "indemnity",
        "legal liability", "public liability",
    ],
    "medical": [
        "medical", "hospitalization", "surgery", "illness",
        "disease", "treatment", "health",
    ],
    "vehicle": [
        "vehicle", "motor", "automobile", "car", "collision",
        "own damage", "third party",
    ],
    "property": [
        "property", "building", "structure", "premises",
        "contents", "stock", "machinery",
    ],
    "life": [
        "life", "death", "survival", "maturity",
        "endowment", "term plan", "whole life",
    ],
    "travel": [
        "travel", "trip", "journey", "baggage",
        "passport", "flight", "overseas",
    ],
}

# retrieval defaults
DEFAULT_TOP_K: int = 8
DEFAULT_RERANK_TOP_K: int = 5

MIN_CONFIDENCE_THRESHOLD: float = 0.45
RERANKER_MIN_SCORE: float = 0.30

MMR_LAMBDA_MULT: float = 0.60

# supabase rpc function name for vector search
SUPABASE_MATCH_FUNCTION: str = "match_policy_chunks"
