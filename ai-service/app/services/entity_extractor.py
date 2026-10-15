"""
Entity Extractor
------------------
Pulls structured entities out of free-text complaint descriptions:
stations/platforms, dates, times/durations, staff mentions, and
vehicle/coach/train numbers.

Implemented with regex pattern matching — deliberately lightweight and
dependency-free (no spaCy/NLTK model download required), which keeps the
service fast to start and easy to run locally. Each entity type has its
own extraction function so any one of them can later be swapped for a
proper NER model (e.g. spaCy custom NER) without affecting the others.

Every function returns a list of strings (possibly empty) — never raises
on text with no matches.
"""

import re

# ---------------------------------------------------------------------------
# Patterns
# ---------------------------------------------------------------------------

# Times and durations: "9 AM", "9:30 PM", "45 minutes", "2 hours", "30 mins"
_TIME_PATTERN = re.compile(
    r"""
    \b\d{1,2}(:\d{2})?\s?(AM|PM|am|pm)\b      # 9 AM, 9:30 PM
    |
    \b\d+\s?(minutes?|mins?|hours?|hrs?)\b    # 45 minutes, 2 hours, 30 mins
    """,
    re.VERBOSE,
)

# Dates: "12 Sep 2026", "12/09/2026", "2026-09-12", "September 12"
_MONTH_NAMES = (
    "January|February|March|April|May|June|July|August|September|"
    "October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec"
)
_DATE_PATTERN = re.compile(
    rf"""
    \b\d{{1,2}}[/-]\d{{1,2}}[/-]\d{{2,4}}\b          # 12/09/2026, 12-09-26
    |
    \b\d{{4}}-\d{{2}}-\d{{2}}\b                       # 2026-09-12
    |
    \b\d{{1,2}}\s({_MONTH_NAMES})(\s\d{{2,4}})?\b     # 12 September 2026
    |
    \b({_MONTH_NAMES})\s\d{{1,2}}(,?\s\d{{2,4}})?\b   # September 12, 2026
    """,
    re.VERBOSE | re.IGNORECASE,
)

# Vehicle/train/bus/coach numbers: "Train 12658", "Bus KA-01-F-1234",
# "Coach S4", "Flight AI202"
_VEHICLE_NUMBER_PATTERN = re.compile(
    r"""
    \b(Train|Bus|Flight|Coach|Metro)\s+[A-Z0-9][A-Z0-9\-]{1,15}\b
    """,
    re.VERBOSE | re.IGNORECASE,
)

# Station/platform mentions: "Platform 3", "Chennai Central", "XYZ Station"
_PLATFORM_PATTERN = re.compile(r"\bPlatform\s?\d+\b", re.IGNORECASE)
_STATION_NAME_PATTERN = re.compile(
    r"\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)\s(Station|Junction|Central|Terminal|Jn)\b"
)

# Staff role mentions: "driver", "conductor", "TTE", "staff", "attendant", "pilot", "guard"
_STAFF_ROLE_PATTERN = re.compile(
    r"\b(driver|conductor|TTE|ticket\s?checker|staff|attendant|guard|pilot|crew member|crew)\b",
    re.IGNORECASE,
)


def extract_times(text: str) -> list[str]:
    """Extracts clock times and durations (e.g. '9 AM', '45 minutes')."""
    matches = _TIME_PATTERN.findall(text)
    # findall with groups returns tuples; re-search raw matches instead for clean strings
    raw_matches = _TIME_PATTERN.finditer(text)
    return _dedupe([m.group(0).strip() for m in raw_matches])


def extract_dates(text: str) -> list[str]:
    """Extracts calendar dates in common formats."""
    raw_matches = _DATE_PATTERN.finditer(text)
    return _dedupe([m.group(0).strip() for m in raw_matches])


def extract_vehicle_numbers(text: str) -> list[str]:
    """Extracts vehicle/service identifiers like 'Train 12658', 'Flight AI202'."""
    raw_matches = _VEHICLE_NUMBER_PATTERN.finditer(text)
    return _dedupe([m.group(0).strip() for m in raw_matches])


def extract_stations(text: str) -> list[str]:
    """Extracts platform references and named stations/junctions/terminals."""
    platforms = [m.group(0).strip() for m in _PLATFORM_PATTERN.finditer(text)]
    station_names = [m.group(0).strip() for m in _STATION_NAME_PATTERN.finditer(text)]
    return _dedupe(platforms + station_names)


def extract_staff_mentions(text: str) -> list[str]:
    """Extracts mentions of staff roles (driver, conductor, TTE, etc.)."""
    raw_matches = _STAFF_ROLE_PATTERN.finditer(text)
    return _dedupe([m.group(0).strip() for m in raw_matches])


def _dedupe(items: list[str]) -> list[str]:
    """Removes duplicates while preserving first-seen order, case-insensitively."""
    seen = set()
    result = []
    for item in items:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result


def extract_entities(text: str) -> dict:
    """
    Runs all extractors and returns a dict matching the
    ExtractedEntities response schema shape:
    { stations, dates, times, staffMentions, vehicleNumbers }
    """
    return {
        "stations": extract_stations(text),
        "dates": extract_dates(text),
        "times": extract_times(text),
        "staffMentions": extract_staff_mentions(text),
        "vehicleNumbers": extract_vehicle_numbers(text),
    }