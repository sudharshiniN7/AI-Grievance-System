"""
Analyze Routes
----------------
Exposes:
  POST /api/analyze  -> runs full complaint analysis
  GET  /              -> simple health check (mounted separately in main.py)

This module orchestrates the five independent analysis services
(sentiment, entities, category/subcategory, priority/severity,
department) into a single response, matching ComplaintAnalysisResponse.
"""

from fastapi import APIRouter, HTTPException

from app.schemas.request_schema import ComplaintAnalysisRequest
from app.schemas.response_schema import ComplaintAnalysisResponse, ExtractedEntities
from app.services.sentiment_analyzer import analyze_sentiment
from app.services.entity_extractor import extract_entities
from app.services.category_classifier import classify
from app.services.priority_severity import score_priority_and_severity
from app.services.department_mapper import suggest_department

router = APIRouter()


@router.post("/api/analyze", response_model=ComplaintAnalysisResponse)
def analyze_complaint(payload: ComplaintAnalysisRequest) -> ComplaintAnalysisResponse:
    """
    Runs full AI analysis on a passenger complaint and returns category,
    subcategory, priority, severity, sentiment, extracted entities, and
    a suggested department.

    All fields are AI-generated suggestions for human review — see the
    `note` field on the response, which is always included.
    """
    try:
        text = payload.complaintText
        transport_mode = payload.transportMode

        sentiment = analyze_sentiment(text)

        classification = classify(text)
        category = classification["category"]
        subcategory = classification["subcategory"]

        scores = score_priority_and_severity(text, category, sentiment)
        priority = scores["priority"]
        severity = scores["severity"]

        entities_dict = extract_entities(text)

        department = suggest_department(category, transport_mode)

        return ComplaintAnalysisResponse(
            category=category,
            subcategory=subcategory,
            priority=priority,
            severity=severity,
            sentiment=sentiment,
            extractedEntities=ExtractedEntities(**entities_dict),
            suggestedDepartment=department,
        )

    except Exception as exc:
        # Any unexpected failure in the analysis pipeline is surfaced as a
        # clean 500 with a safe message — never leaks raw stack traces to
        # the caller, but logs are left to the server console via FastAPI's
        # default exception handling plus this explicit catch.
        raise HTTPException(
            status_code=500,
            detail=f"Complaint analysis failed: {str(exc)}",
        ) from exc