from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.report import Report
from app.models.report_history import ReportHistory
from app.schemas.report import (
    ReportCreate, ReportResponse, ReportListResponse,
    ReportStatusUpdate, ReportDetailResponse, VALID_STATUSES,
    DuplicateCheckRequest, DuplicateCheckResponse,
)
from app.schemas.common import SuccessResponse
from app.core.security import get_current_user, require_role
from app.services.ai_service import mock_classify, assess_severity, calculate_priority
from app.services.duplicate_service import find_duplicate
from app.services.workflow_service import transition_report_status
from app.schemas.common import SuccessResponse
from app.core.security import get_current_user, require_role
import os
from app.services.ai_service import classify_image, download_image_temp, assess_severity, calculate_priority
from app.services.duplicate_service import find_duplicate
from app.services.workflow_service import transition_report_status

router = APIRouter(prefix="/reports", tags=["Reports"])

ALLOWED_SORT_FIELDS = {
    "created_at": Report.created_at,
    "priority_score": Report.priority_score,
}


@router.post("", response_model=SuccessResponse[ReportResponse], status_code=201)
def create_report(
    data: ReportCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = Report(
        user_id=current_user["id"],
        description=data.description,
        image_url=data.image_url,
        latitude=data.latitude,
        longitude=data.longitude,
        status="pending"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    local_path = download_image_temp(report.image_url)
    try:
        category, confidence, bbox = classify_image(local_path)
    finally:
        os.unlink(local_path)
    severity, _ = assess_severity(bbox, report.description)
    priority_score, _ = calculate_priority(severity=severity, age_hours=0)

    candidates = (
        db.query(Report.id, Report.latitude, Report.longitude, Report.image_url)
        .filter(Report.id != report.id)
        .all()
    )
    is_dup, _, _, _ = find_duplicate(
        new_lat=report.latitude,
        new_lon=report.longitude,
        new_image_url=report.image_url,
        candidates=candidates,
    )

    report.category = category
    report.ai_confidence = confidence
    report.severity = severity
    report.priority_score = priority_score
    report.is_duplicate = is_dup
    db.add(report)
    db.commit()
    db.refresh(report)

    return SuccessResponse(data=ReportResponse.from_orm(report), message="Laporan berhasil dibuat")


@router.get("", response_model=SuccessResponse[ReportListResponse])
def list_reports(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: str = Query("created_at", description="created_at | priority_score"),
    order: str = Query("desc", description="asc | desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)
    if severity:
        query = query.filter(Report.severity == severity)
    if category:
        query = query.filter(Report.category == category)

    sort_column = ALLOWED_SORT_FIELDS.get(sort_by, Report.created_at)
    query = query.order_by(sort_column.desc() if order == "desc" else sort_column.asc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    result = ReportListResponse(total=total, page=page, page_size=page_size, items=items)
    return SuccessResponse(data=result, message="OK")


@router.get("/{report_id}", response_model=SuccessResponse[ReportDetailResponse])
def get_report_detail(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    history = (
        db.query(ReportHistory)
        .filter(ReportHistory.report_id == report_id)
        .order_by(ReportHistory.updated_at.asc())
        .all()
    )
    report_data = ReportResponse.from_orm(report).model_dump()
    detail = ReportDetailResponse(**report_data, history=history)
    return SuccessResponse(data=detail, message="OK")


@router.put("/{report_id}/status", response_model=SuccessResponse[ReportResponse])
def update_report_status(
    report_id: str,
    data: ReportStatusUpdate,
    current_user: dict = Depends(require_role("admin", "maintenance")),
    db: Session = Depends(get_db)
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Status tidak valid. Pilih salah satu: {
                ', '.join(VALID_STATUSES)}")

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    report = transition_report_status(report, data.status, current_user["id"], db)
    return SuccessResponse(data=ReportResponse.from_orm(report), message="Status laporan berhasil diperbarui")


@router.post("/check-duplicate", response_model=SuccessResponse[DuplicateCheckResponse])
def check_duplicate(
    data: DuplicateCheckRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    candidates = db.query(Report.id, Report.latitude, Report.longitude, Report.image_url).all()
    is_dup, matched_id, distance, similarity = find_duplicate(
        new_lat=data.latitude,
        new_lon=data.longitude,
        new_image_url=data.image_url,
        candidates=candidates,
        radius_meters=data.radius_meters,
        similarity_threshold=data.similarity_threshold,
    )
    result = DuplicateCheckResponse(
        is_duplicate=is_dup,
        duplicate_report_id=matched_id,
        distance_meters=distance,
        image_similarity=similarity,
    )
    return SuccessResponse(data=result, message="OK")
