from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse, RefreshRequest, AccessTokenResponse
from app.schemas.report import (
    ReportCreate, ReportResponse, ReportListResponse,
    ReportStatusUpdate, ReportHistoryItem, ReportDetailResponse
)
from app.schemas.ai import (
    ClassifyRequest, ClassifyResponse,
    SeverityRequest, SeverityResponse,
    PriorityRequest, PriorityResponse,
)