"""
Priority & Severity Scorer
------------------------------
Determines priority (Low/Medium/High) and severity (Low/Medium/High/
Critical) for a complaint, based on category, sentiment, and the
presence of urgency/safety-related keywords in the text.

Priority and severity are related but distinct, matching the existing
Node.js/Mongoose model:
- priority: how quickly this needs attention (drives SLA due date).
- severity: how serious/impactful the issue is, independent of timing.

A Safety Concern is always escalated in both priority and severity,
regardless of sentiment, since passenger safety issues warrant urgent
handling even if reported in calm language.

This module is isolated behind score_priority_and_severity() so its
rules can be tuned, or replaced with a learned scoring model, without
touching classification or sentiment logic elsewhere.
"""

import re

# ---------------------------------------------------------------------------
# Urgency keywords — presence of these pushes priority/severity upward
# regardless of category.
# ---------------------------------------------------------------------------
_CRITICAL_KEYWORDS = [
    "fire", "smoke", "assault", "molest", "weapon", "accident", "injury",
    "injured", "emergency", "theft", "stolen", "robbed", "threatened",
    "unconscious", "medical emergency", "life threatening", "attacked",
]

_HIGH_URGENCY_KEYWORDS = [
    "unsafe", "harassed", "harassment", "stranded", "security",
    "cancelled", "canceled", "denied boarding", "no staff",
]

_PRIORITY_RANK = {"Low": 0, "Medium": 1, "High": 2}
_SEVERITY_RANK = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}


def _contains_any(text_lower: str, keywords: list[str]) -> bool:
    for keyword in keywords:
        if " " in keyword:
            if keyword in text_lower:
                return True
        else:
            if re.search(rf"\b{re.escape(keyword)}\b", text_lower):
                return True
    return False


def _base_priority_from_category(category: str) -> str:
    """Starting priority before adjustments, based on category alone."""
    if category == "Safety Concern":
        return "High"
    if category in ("Delay", "Staff Behaviour"):
        return "Medium"
    if category in ("Cleanliness", "Ticketing / Billing"):
        return "Low"
    return "Low"  # Other


def _base_severity_from_category(category: str) -> str:
    """Starting severity before adjustments, based on category alone."""
    if category == "Safety Concern":
        return "High"
    if category == "Staff Behaviour":
        return "Medium"
    if category == "Delay":
        return "Medium"
    if category in ("Cleanliness", "Ticketing / Billing"):
        return "Low"
    return "Low"  # Other


def _max_rank(current: str, candidate: str, rank_table: dict) -> str:
    """Returns whichever of current/candidate has the higher rank."""
    if rank_table[candidate] > rank_table[current]:
        return candidate
    return current


def score_priority_and_severity(text: str, category: str, sentiment: str) -> dict:
    """
    Returns {"priority": ..., "severity": ...}.

    Args:
        text: the complaint description.
        category: category already determined by category_classifier.
        sentiment: sentiment already determined by sentiment_analyzer.
    """
    text_lower = text.lower()

    priority = _base_priority_from_category(category)
    severity = _base_severity_from_category(category)

    # Negative sentiment nudges priority up one level (not severity —
    # tone reflects urgency of response more than objective impact).
    if sentiment == "Negative":
        if priority == "Low":
            priority = "Medium"
        elif priority == "Medium":
            priority = "High"

    # High-urgency keywords push both up, regardless of category.
    if _contains_any(text_lower, _HIGH_URGENCY_KEYWORDS):
        priority = _max_rank(priority, "High", _PRIORITY_RANK)
        severity = _max_rank(severity, "High", _SEVERITY_RANK)

    # Critical keywords always force the highest levels, overriding
    # everything else — these indicate potential danger to passengers.
    if _contains_any(text_lower, _CRITICAL_KEYWORDS):
        priority = "High"
        severity = "Critical"

    return {"priority": priority, "severity": severity}