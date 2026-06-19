from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from infravision.backend.app.database import Base
import uuid


class ReportHistory(Base):
    __tablename__ = "report_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("reports.id"), nullable=False)
    previous_status = Column(String(30), nullable=True)
    current_status = Column(String(30), nullable=False)
    changed_by = Column(String, ForeignKey("users.id"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
