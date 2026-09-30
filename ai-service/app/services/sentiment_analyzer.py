"""
Sentiment Analyzer
--------------------
Determines the emotional tone of a complaint (Positive / Neutral / Negative).

Two layers work together:

1. VADER (Valence Aware Dictionary and sEntiment Reasoner) — a lexicon and
   rule-based sentiment tool, good at catching emotionally-worded text.

2. A lightweight complaint-context keyword layer — real passenger
   complaints are often short and purely factual ("Train delayed by 2
   hours.", "AC is not working.") with no emotionally-charged words at
   all, which VADER alone tends to score as Neutral even though a human
   reading it would clearly recognise it as a complaint. This layer only
   activates when VADER is undecided (Neutral), and looks for known
   problem-indicating words/phrases specific to transport grievances.
   If VADER already found something Negative or Positive, that result is
   trusted as-is — this layer never overrides a non-Neutral VADER result.

This keeps genuinely neutral, informational statements
("The train departs from platform 3 at 9 AM.") classified as Neutral,
since they contain no problem-indicator language.

This module is intentionally isolated behind a single function
(analyze_sentiment) so either layer can be swapped or upgraded later
(e.g. VADER replaced with a fine-tuned transformer model) without
touching any other part of the AI service.
"""

import re

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()

# Thresholds recommended by VADER's own documentation for compound score.
_POSITIVE_THRESHOLD = 0.05
_NEGATIVE_THRESHOLD = -0.05

# ---------------------------------------------------------------------------
# Complaint-context negative indicators.
#
# These are deliberately specific to transport-grievance language rather
# than generic negative words, to avoid over-triggering on neutral text.
# Multi-word phrases are matched as phrases; single words are matched as
# whole words (via regex word boundaries) to avoid partial-word false
# matches (e.g. "late" should not match inside "plate").
# ---------------------------------------------------------------------------
_NEGATIVE_PHRASES = [
    "nobody informed",
    "no staff",
    "no one informed",
    "not working",
    "not functioning",
    "no water",
    "no announcement",
    "no information",
    "long queue",
    "waited for hours",
    "out of service",
]

_NEGATIVE_WORDS = [
    "delay",
    "delayed",
    "late",
    "broken",
    "missing",
    "rude",
    "cancelled",
    "canceled",
    "overcrowded",
    "dirty",
    "unclean",
    "unsafe",
    "unhygienic",
    "harassed",
    "harassment",
    "misbehaved",
    "misbehaviour",
    "misbehavior",
    "stranded",
    "malfunctioning",
    "faulty",
    "leaking",
    "smelly",
    "filthy",
    "unattended",
    "ignored",
    "refused",
    "overcharged",
    "denied",
]

# Precompile word-boundary patterns once, at import time, for efficiency.
_WORD_PATTERNS = [
    re.compile(rf"\b{re.escape(word)}\b", re.IGNORECASE) for word in _NEGATIVE_WORDS
]


def _contains_negative_indicator(text: str) -> bool:
    """
    Returns True if the text contains any known complaint-context
    negative phrase or word, regardless of overall emotional tone.
    """
    lowered = text.lower()

    for phrase in _NEGATIVE_PHRASES:
        if phrase in lowered:
            return True

    for pattern in _WORD_PATTERNS:
        if pattern.search(lowered):
            return True

    return False


def analyze_sentiment(text: str) -> str:
    """
    Returns one of: "Positive", "Neutral", "Negative".

    Args:
        text: the complaint description to analyze.
    """
    scores = _analyzer.polarity_scores(text)
    compound = scores["compound"]

    if compound >= _POSITIVE_THRESHOLD:
        return "Positive"

    if compound <= _NEGATIVE_THRESHOLD:
        return "Negative"

    # VADER is undecided (Neutral) — check for complaint-specific
    # problem language before settling on Neutral.
    if _contains_negative_indicator(text):
        return "Negative"

    return "Neutral"