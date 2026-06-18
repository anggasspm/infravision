from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

VALID_STATUSES = ["pending", "verified", "assigned", "in_progress", "under_repair", "completed"]

class ReportCreate(BaseModel):
    description: str
    image_url: str
    latitude: float
    longitude: float

class ReportResponse(BaseModel):
    id: str
    user_id: str
    category: Optional[str] = None
    description: str
    image_url: str
    latitude: float
    longitude: float
    ai_confidence: Optional[float] = None
    severity: Optional[str] = None
    priority_score: Optional[int] = None
    status: str
    is_duplicate: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ReportListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ReportResponse]

class ReportStatusUpdate(BaseModel):
    status: str = Field(..., description=f"Salah satu dari: {', '.join(VALID_STATUSES)}")

class ReportHistoryItem(BaseModel):
    id: str
    previous_status: Optional[str] = None
    current_status: str
    changed_by: str
    updated_at: datetime

    class Config:
        from_attributes = True

class ReportDetailResponse(ReportResponse):
    history: List[ReportHistoryItem] = []