from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from infravision.backend.app.database import get_db
from infravision.backend.app.models.report import Report
from infravision.backend.app.models.user import User
from infravision.backend.app.schemas.report import ReportResponse
from infravision.backend.app.schemas.admin import AssignRequest
from infravision.backend.app.schemas.common import SuccessResponse
from infravision.backend.app.core.security import require_role
from infravision.backend.app.services.workflow_service import transition_report_status

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/verify/{report_id}", response_model=SuccessResponse[ReportResponse])
def verify_report(
    report_id: str,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    report = transition_report_status(report, "verified", current_user["id"], db)
    return SuccessResponse(data=ReportResponse.from_orm(report), message="Laporan berhasil diverifikasi")


@router.post("/assign/{report_id}", response_model=SuccessResponse[ReportResponse])
def assign_report(
    report_id: str,
    data: AssignRequest,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    maintenance_user = db.query(User).filter(User.id == data.assigned_to).first()
    if not maintenance_user:
        raise HTTPException(status_code=404, detail="User maintenance tidak ditemukan")
    if maintenance_user.role != "maintenance":
        raise HTTPException(status_code=400, detail="User yang ditugaskan harus berrole maintenance")

    report.assigned_to = data.assigned_to
    db.add(report)
    db.commit()
    db.refresh(report)

    report = transition_report_status(report, "assigned", current_user["id"], db)
    return SuccessResponse(data=ReportResponse.from_orm(report), message="Laporan berhasil ditugaskan")
