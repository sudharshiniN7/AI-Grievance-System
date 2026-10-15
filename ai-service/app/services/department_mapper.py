"""
Department Mapper
--------------------
Suggests which department a complaint should be routed to, based on its
category and (optionally) transport mode.

Mirrors the "assignedDepartment" field already present on the Node.js
Complaint model — this returns a plain string suggestion that the Node
backend can later write directly into that field (or present to a human
dispatcher for confirmation, since this is a suggestion, not an automatic
assignment).

Mapping is deliberately simple (a direct category -> department table,
refined slightly by transport mode) so it's easy to audit and adjust for
a specific transport authority's real department names later.
"""

# ---------------------------------------------------------------------------
# Base mapping: category -> department.
# ---------------------------------------------------------------------------
_CATEGORY_DEPARTMENT_MAP: dict[str, str] = {
    "Delay": "Operations",
    "Cleanliness": "Facility Maintenance",
    "Staff Behaviour": "Human Resources / Staff Conduct",
    "Safety Concern": "Security & Safety",
    "Ticketing / Billing": "Ticketing & Revenue",
    "Other": "General Grievance Cell",
}

# ---------------------------------------------------------------------------
# Transport-mode-specific overrides.
# Only used when a (category, transportMode) pair needs a more specific
# department than the base category mapping gives. Not every combination
# needs an override — only the ones where mode genuinely changes who
# should handle it.
# ---------------------------------------------------------------------------
_MODE_OVERRIDES: dict[tuple[str, str], str] = {
    ("Delay", "Flight"): "Airline Operations",
    ("Safety Concern", "Flight"): "Airport Security",
    ("Ticketing / Billing", "Flight"): "Airline Reservations",
    ("Delay", "Metro"): "Metro Operations Control",
    ("Cleanliness", "Metro"): "Metro Facility Maintenance",
}


def suggest_department(category: str, transport_mode: str | None = None) -> str:
    """
    Returns the suggested department string for a given category and
    optional transport mode.

    Args:
        category: one of the known CATEGORIES values (falls back to
                  "General Grievance Cell" if unrecognised).
        transport_mode: optional, e.g. "Train", "Bus", "Metro", "Flight", "Ferry".
    """
    if transport_mode:
        override_key = (category, transport_mode)
        if override_key in _MODE_OVERRIDES:
            return _MODE_OVERRIDES[override_key]

    return _CATEGORY_DEPARTMENT_MAP.get(category, "General Grievance Cell")