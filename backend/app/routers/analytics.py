from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from collections import Counter
from app.database import get_db
from app.models.report import Report
from app.models.report_history import ReportHistory
from app.schemas.analytics import AnalyticsSummary, CategoryDistribution, DailyTrend
from app.schemas.common import SuccessResponse
from app.core.security import require_role

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=SuccessResponse[AnalyticsSummary])
def get_summary(
    current_user: dict = Depends(require_role("admin", "maintenance")),
    db: Session = Depends(get_db)
):
    reports = db.query(Report).all()
    total = len(reports)

    status_counts = Counter(r.status for r in reports)
    category_counts = Counter(r.category for r in reports if r.category)
    severity_counts = Counter(r.severity for r in reports if r.severity)

    category_distribution = [
        CategoryDistribution(category=cat, count=cnt) for cat, cnt in category_counts.items()
    ]

    completed_durations = []
    for r in reports:
        if r.status == "completed":
            completed_entry = (
                db.query(ReportHistory)
                .filter(ReportHistory.report_id == r.id, ReportHistory.current_status == "completed")
                .order_by(ReportHistory.updated_at.desc())
                .first()
            )
            if completed_entry and r.created_at:
                duration = (completed_entry.updated_at - r.created_at).total_seconds() / 3600
                completed_durations.append(duration)

    avg_response_time_hours = (
        round(sum(completed_durations) / len(completed_durations), 2) if completed_durations else None
    )

    today = datetime.utcnow().date()
    trend_map = {(today - timedelta(days=i)).isoformat(): 0 for i in range(6, -1, -1)}
    for r in reports:
        if r.created_at:
            day_str = r.created_at.date().isoformat()
            if day_str in trend_map:
                trend_map[day_str] += 1

    daily_trend = [DailyTrend(date=d, count=c) for d, c in trend_map.items()]

    summary = AnalyticsSummary(
        total_reports=total,
        status_distribution=dict(status_counts),
        category_distribution=category_distribution,
        severity_distribution=dict(severity_counts),
        avg_response_time_hours=avg_response_time_hours,
        daily_trend=daily_trend,
    )
    return SuccessResponse(data=summary, message="OK")