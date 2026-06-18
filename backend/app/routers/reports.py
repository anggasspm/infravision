from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.report import Report
from app.models.report_history import ReportHistory
from app.schemas.report import (
    ReportCreate, ReportResponse, ReportListResponse,
    ReportStatusUpdate, ReportDetailResponse, VALID_STATUSES
)
from app.core.security import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

ALLOWED_SORT_FIELDS = {
    "created_at": Report.created_at,
    "priority_score": Report.priority_score,
}

@router.post("", response_model=ReportResponse, status_code=201)
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
    # TODO Sprint 3: trigger AI pipeline (klasifikasi, severity, priority, duplicate check)
    return report

@router.get("", response_model=ReportListResponse)
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
    return ReportListResponse(total=total, page=page, page_size=page_size, items=items)

@router.get("/{report_id}", response_model=ReportDetailResponse)
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
    return ReportDetailResponse(**report_data, history=history)

@router.put("/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    report_id: str,
    data: ReportStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status tidak valid. Pilih salah satu: {', '.join(VALID_STATUSES)}")

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    previous_status = report.status
    report.status = data.status
    db.add(report)

    history_entry = ReportHistory(
        report_id=report.id,
        previous_status=previous_status,
        current_status=data.status,
        changed_by=current_user["id"]
    )
    db.add(history_entry)
    db.commit()
    db.refresh(report)
    return report