from fastapi import HTTPException
from sqlalchemy.orm import Session
from infravision.backend.app.models.report import Report
from infravision.backend.app.models.report_history import ReportHistory
from infravision.backend.app.services.notification_service import create_notification

STATE_TRANSITIONS = {
    "pending": ["verified"],
    "verified": ["assigned"],
    "assigned": ["in_progress"],
    "in_progress": ["under_repair"],
    "under_repair": ["completed"],
    "completed": [],
}

STATUS_LABELS_ID = {
    "pending": "Menunggu",
    "verified": "Terverifikasi",
    "assigned": "Ditugaskan",
    "in_progress": "Sedang Dikerjakan",
    "under_repair": "Dalam Perbaikan",
    "completed": "Selesai",
}

def transition_report_status(report: Report, new_status: str, changed_by: str, db: Session) -> Report:
    """Validasi transisi sesuai state machine PRD, catat ke report_history, kirim notifikasi ke pelapor."""
    current_status = report.status
    allowed_next = STATE_TRANSITIONS.get(current_status, [])

    if new_status not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=f"Tidak bisa pindah dari status '{current_status}' ke '{new_status}'. "
            f"Status valid selanjutnya: {allowed_next or 'tidak ada (status final)'}"
        )

    previous_status = report.status
    report.status = new_status
    db.add(report)

    history_entry = ReportHistory(
        report_id=report.id,
        previous_status=previous_status,
        current_status=new_status,
        changed_by=changed_by,
    )
    db.add(history_entry)
    db.commit()
    db.refresh(report)

    create_notification(
        db=db,
        user_id=report.user_id,
        report_id=report.id,
        message=f"Status laporan Anda berubah menjadi {STATUS_LABELS_ID.get(new_status, new_status)}.",
    )

    return report
