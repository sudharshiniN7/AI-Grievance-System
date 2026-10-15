"""
AI/NLP Service — Entry Point
-------------------------------
FastAPI application for the Passenger Grievance Redressal System's
AI/NLP analysis service. Runs independently from the Node.js backend —
communicates only via REST, as required by the project architecture:

    React Frontend -> Node.js/Express Backend -> Python AI/NLP Service

This service does not talk to MongoDB or the Node backend directly; it
receives complaint text, analyzes it, and returns a result. Integration
(the Node backend calling this service) is handled in a later step.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.routes.analyze import router as analyze_router

app = FastAPI(
    title="Passenger Grievance Redressal — AI/NLP Service",
    description=(
        "Analyzes passenger complaints and returns category, subcategory, "
        "priority, severity, sentiment, extracted entities, and a suggested "
        "department. All results are AI-generated suggestions for human "
        "review, not confirmed determinations."
    ),
    version="1.0.0",
)

# ---------- CORS ----------
# Allows the Node.js backend (and optionally the frontend) to call this
# service from a different origin during local development. Origins are
# read from environment variables — never hardcoded.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Routes ----------
app.include_router(analyze_router)


@app.get("/")
def health_check():
    """
    Simple health check endpoint. Confirms the service is running and
    reachable, without performing any analysis.
    """
    return {
        "success": True,
        "service": "AI/NLP Grievance Analysis Service",
        "status": "running",
        "environment": settings.ENVIRONMENT,
    }


# ---------- Validation error handler ----------
# Converts Pydantic's default 422 validation error shape into a response
# consistent with the rest of this service's JSON format.
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        f"{'.'.join(str(loc) for loc in err['loc'] if loc != 'body')}: {err['msg']}"
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Invalid request data.",
            "errors": errors,
        },
    )


# ---------- Catch-all error handler ----------
# Safety net for anything not already handled — ensures the service never
# returns a raw, unstructured error to the caller.
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected error occurred in the AI service.",
        },
    )