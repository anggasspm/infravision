from sqlalchemy import Column, String, Text, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
import uuid

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=True)       # diisi AI pipeline (Sprint 3)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    ai_confidence = Column(Float, nullable=True)        # diisi AI pipeline (Sprint 3)
    severity = Column(String(20), nullable=True)         # diisi AI pipeline (Sprint 3)
    priority_score = Column(Integer, nullable=True)      # diisi AI pipeline (Sprint 3)
    status = Column(String(30), nullable=False, default="pending")
    is_duplicate = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())