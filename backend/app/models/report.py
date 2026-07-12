from sqlalchemy import Column, String, Text, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # Nullable: laporan bisa dibuat tanpa akun (tamu). Kalau user_id NULL,
    # laporan itu anonim dan hanya bisa dilacak lewat tracking_code.
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    # Kode pendek untuk lacak status tanpa login, mis. "INV-7K3F9M".
    # Dibuat untuk SEMUA laporan (bukan cuma tamu) supaya satu mekanisme
    # lacak yang sama berlaku ke semua orang.
    tracking_code = Column(String(20), nullable=False, unique=True, index=True)
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