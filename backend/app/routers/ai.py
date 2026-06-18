from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.schemas.ai import (
    ClassifyRequest, ClassifyResponse,
    SeverityRequest, SeverityResponse,
    PriorityRequest, PriorityResponse,
)
from app.services.ai_service import mock_classify, assess_severity, calculate_priority

router = APIRouter(prefix="/ai", tags=["AI Pipeline"])

@router.post("/classify", response_model=ClassifyResponse)
def classify_image(data: ClassifyRequest, current_user: dict = Depends(get_current_user)):
    category, confidence, bbox = mock_classify(data.image_url)
    return ClassifyResponse(category=category, confidence=confidence, bbox=bbox)

@router.post("/severity", response_model=SeverityResponse)
def get_severity(data: SeverityRequest, current_user: dict = Depends(get_current_user)):
    severity, area_ratio = assess_severity(data.bbox, data.description)
    return SeverityResponse(severity=severity, area_ratio=area_ratio)

@router.post("/priority", response_model=PriorityResponse)
def get_priority(data: PriorityRequest, current_user: dict = Depends(get_current_user)):
    score, level = calculate_priority(
        severity=data.severity,
        report_frequency=data.report_frequency,
        location_importance=data.location_importance,
        age_hours=data.age_hours,
    )
    return PriorityResponse(priority_score=score, priority_level=level)