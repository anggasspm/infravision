from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.schemas.ai import (
    ClassifyRequest, ClassifyResponse,
    SeverityRequest, SeverityResponse,
    PriorityRequest, PriorityResponse,
)
from app.schemas.common import SuccessResponse
from app.services.ai_service import mock_classify, assess_severity, calculate_priority
from app.schemas.common import SuccessResponse
from app.services.ai_service import classify_image, download_image_temp, assess_severity, calculate_priority
import os

router = APIRouter(prefix="/ai", tags=["AI Pipeline"])


@router.post("/classify", response_model=SuccessResponse[ClassifyResponse])
def classify_image_endpoint(data: ClassifyRequest, current_user: dict = Depends(get_current_user)):
    local_path = download_image_temp(data.image_url)
    try:
        category, confidence, bbox = classify_image(local_path)
    finally:
        os.unlink(local_path)
    result = ClassifyResponse(category=category, confidence=confidence, bbox=bbox)
    return SuccessResponse(data=result, message="OK")


@router.post("/severity", response_model=SuccessResponse[SeverityResponse])
def get_severity(data: SeverityRequest, current_user: dict = Depends(get_current_user)):
    severity, area_ratio = assess_severity(data.bbox, data.description)
    result = SeverityResponse(severity=severity, area_ratio=area_ratio)
    return SuccessResponse(data=result, message="OK")


@router.post("/priority", response_model=SuccessResponse[PriorityResponse])
def get_priority(data: PriorityRequest, current_user: dict = Depends(get_current_user)):
    score, level = calculate_priority(
        severity=data.severity,
        report_frequency=data.report_frequency,
        location_importance=data.location_importance,
        age_hours=data.age_hours,
    )
    result = PriorityResponse(priority_score=score, priority_level=level)
    return SuccessResponse(data=result, message="OK")
