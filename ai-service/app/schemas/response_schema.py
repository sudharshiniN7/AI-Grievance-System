"""
Response Schema
-----------------
Defines the shape of the JSON returned by POST /api/analyze, matching the
fields your Node.js Complaint model already supports (category,
subcategory, priority, severity, sentiment, extractedEntities,
assignedDepartment) so future integration requires no reshaping.
"""

from pydantic import BaseModel, Field


class ExtractedEntities(BaseModel):
    """
    Flexible entity buckets pulled from the complaint text.
    Each list may be empty if nothing of that type was found.
    """

    stations: list[str] = Field(default_factory=list)
    dates: list[str] = Field(default_factory=list)
    times: list[str] = Field(default_factory=list)
    staffMentions: list[str] = Field(default_factory=list)
    vehicleNumbers: list[str] = Field(default_factory=list)


class ComplaintAnalysisResponse(BaseModel):
    category: str
    subcategory: str
    priority: str
    severity: str
    sentiment: str
    extractedEntities: ExtractedEntities
    suggestedDepartment: str

    # Every AI-generated field here is a suggestion for a human reviewer,
    # not a determination of fact. See note field below.
    note: str = Field(
        default=(
            "This analysis is AI-generated and reflects suspected patterns "
            "in the complaint text only. It does not confirm root cause and "
            "should be reviewed by a human before final action is taken."
        )
    )

    class Config:
        json_schema_extra = {
            "example": {
                "category": "Delay",
                "subcategory": "Communication Failure",
                "priority": "Medium",
                "severity": "Medium",
                "sentiment": "Negative",
                "extractedEntities": {
                    "stations": [],
                    "dates": [],
                    "times": ["45 minutes"],
                    "staffMentions": [],
                    "vehicleNumbers": [],
                },
                "suggestedDepartment": "Operations",
                "note": (
                    "This analysis is AI-generated and reflects suspected patterns "
                    "in the complaint text only. It does not confirm root cause and "
                    "should be reviewed by a human before final action is taken."
                ),
            }
        }