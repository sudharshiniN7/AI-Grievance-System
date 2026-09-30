"""
Request Schema
----------------
Defines and validates the shape of incoming requests to POST /api/analyze.
"""

from pydantic import BaseModel, Field, field_validator


class ComplaintAnalysisRequest(BaseModel):
    """
    Input payload for complaint analysis.

    complaintText is the only strictly required field. transportMode is
    optional but recommended — it lets the department-mapping module give
    more accurate suggestions (e.g. "Bus" vs "Train" often route to
    different operational teams).
    """

    complaintText: str = Field(
        ...,
        min_length=10,
        max_length=3000,
        description="The passenger's complaint description, in free text.",
    )
    transportMode: str | None = Field(
        default=None,
        description="Optional: Train, Bus, Metro, Flight, Ferry, etc.",
    )

    @field_validator("complaintText")
    @classmethod
    def complaintText_must_not_be_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("complaintText cannot be empty or whitespace only.")
        return stripped

    @field_validator("transportMode")
    @classmethod
    def normalize_transport_mode(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped if stripped else None

    class Config:
        json_schema_extra = {
            "example": {
                "complaintText": "The bus was 45 minutes late and nobody informed us.",
                "transportMode": "Bus",
            }
        }