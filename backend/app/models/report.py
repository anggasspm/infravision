from sqlalchemy import Column, String, Text, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from infravision.backend.app.database import Base
import uuid


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    ai_confidence = Column(Float, nullable=True)
    severity = Column(String(20), nullable=True)
    priority_score = Column(Integer, nullable=True)
    status = Column(String(30), nullable=False, default="pending")
    is_duplicate = Column(Boolean, default=False)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
