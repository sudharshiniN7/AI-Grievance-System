"""
Category Classifier
----------------------
Determines a complaint's category and subcategory from its text.

Implemented as keyword/phrase scoring: each category has a set of
associated keywords, the complaint text is scored against every
category, and the highest-scoring category wins (ties broken by a fixed
priority order). "Other" is the fallback when nothing scores above zero.

Categories match the existing Node.js/Mongoose CATEGORIES enum exactly:
Delay, Cleanliness, Staff Behaviour, Safety Concern, Ticketing / Billing,
Other — so results plug directly into the existing Complaint model with
no reshaping needed.

This module is isolated behind a single function (classify_category) so
it can later be replaced with a trained text-classification model
(e.g. a fine-tuned transformer) without affecting any other module.
"""

import re

# ---------------------------------------------------------------------------
# Category keyword banks.
# Order of dict also defines tie-break priority (earlier wins on a tie).
# ---------------------------------------------------------------------------

_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Safety Concern": [
        "unsafe", "safety", "accident", "fire", "smoke", "harassed",
        "harassment", "molest", "theft", "stolen", "robbed", "assault",
        "threat", "threatened", "weapon", "fight", "injury", "injured",
        "emergency", "stranded", "security",
    ],
    "Staff Behaviour": [
        "rude", "misbehaved", "misbehaviour", "misbehavior", "driver",
        "conductor", "staff behaviour", "staff behavior", "ignored us",
        "shouted", "abusive", "unhelpful", "unprofessional", "refused to help",
        "attendant", "crew",
    ],
    "Cleanliness": [
        "dirty", "unclean", "unhygienic", "filthy", "smelly", "garbage",
        "trash", "litter", "littered", "not cleaned", "washroom", "toilet",
        "stink", "cockroach", "pest",
    ],
    "Ticketing / Billing": [
        "refund", "overcharged", "billing", "payment", "ticket price",
        "fare", "booking", "double charged", "wrong amount", "receipt",
        "invoice", "charged twice", "discount", "coupon",
    ],
    "Delay": [
        "delay", "delayed", "late", "nobody informed", "no announcement",
        "waiting", "waited", "cancelled", "canceled", "missed connection",
        "behind schedule", "no information", "held up",
    ],
}

# Subcategories per category — matched the same way, scoped within the
# chosen category's text so subcategory logic stays simple.
_SUBCATEGORY_KEYWORDS: dict[str, dict[str, list[str]]] = {
    "Delay": {
        "Communication Failure": ["nobody informed", "no announcement", "no information", "not notified"],
        "Schedule Delay": ["delay", "delayed", "late", "behind schedule"],
        "Service Cancellation": ["cancelled", "canceled", "missed connection"],
    },
    "Cleanliness": {
        "Washroom Hygiene": ["washroom", "toilet", "no water"],
        "Coach/Cabin Cleanliness": ["coach", "cabin", "seat", "not cleaned", "dirty floor"],
        "Waste Management": ["garbage", "trash", "litter", "littered"],
    },
    "Staff Behaviour": {
        "Rudeness": ["rude", "shouted", "abusive"],
        "Unprofessional Conduct": ["misbehaved", "misbehaviour", "misbehavior", "unprofessional"],
        "Lack of Assistance": ["unhelpful", "refused to help", "ignored us"],
    },
    "Safety Concern": {
        "Harassment": ["harassed", "harassment", "molest", "threat", "threatened"],
        "Theft/Security": ["theft", "stolen", "robbed", "security"],
        "Physical Safety Hazard": ["fire", "smoke", "injury", "injured", "accident", "emergency"],
    },
    "Ticketing / Billing": {
        "Refund Issue": ["refund"],
        "Overcharging": ["overcharged", "double charged", "charged twice", "wrong amount"],
        "Booking Error": ["booking", "ticket price", "fare", "discount", "coupon"],
    },
}

_DEFAULT_SUBCATEGORY = "General"


def _score_text_against_keywords(text_lower: str, keywords: list[str]) -> int:
    """Counts how many of the given keywords/phrases appear in the text."""
    score = 0
    for keyword in keywords:
        if " " in keyword:
            # Multi-word phrase — simple substring match.
            if keyword in text_lower:
                score += 1
        else:
            # Single word — whole-word match to avoid partial matches.
            if re.search(rf"\b{re.escape(keyword)}\b", text_lower):
                score += 1
    return score


def classify_category(text: str) -> str:
    """
    Returns the best-matching category name, or "Other" if no
    category's keywords appear in the text at all.
    """
    text_lower = text.lower()

    best_category = "Other"
    best_score = 0

    for category, keywords in _CATEGORY_KEYWORDS.items():
        score = _score_text_against_keywords(text_lower, keywords)
        if score > best_score:
            best_score = score
            best_category = category

    return best_category


def classify_subcategory(text: str, category: str) -> str:
    """
    Returns the best-matching subcategory within the given category,
    or "General" if the category has no subcategory map or nothing matches.
    """
    subcategory_map = _SUBCATEGORY_KEYWORDS.get(category)
    if not subcategory_map:
        return _DEFAULT_SUBCATEGORY

    text_lower = text.lower()
    best_subcategory = _DEFAULT_SUBCATEGORY
    best_score = 0

    for subcategory, keywords in subcategory_map.items():
        score = _score_text_against_keywords(text_lower, keywords)
        if score > best_score:
            best_score = score
            best_subcategory = subcategory

    return best_subcategory


def classify(text: str) -> dict:
    """
    Convenience function: returns both category and subcategory together.
    """
    category = classify_category(text)
    subcategory = classify_subcategory(text, category)
    return {"category": category, "subcategory": subcategory}