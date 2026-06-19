from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse, RefreshRequest, AccessTokenResponse
from app.schemas.report import (
    ReportCreate, ReportResponse, ReportListResponse,
    ReportStatusUpdate, ReportHistoryItem, ReportDetailResponse,
    DuplicateCheckRequest, DuplicateCheckResponse,
)
from app.schemas.ai import (
    ClassifyRequest, ClassifyResponse,
    SeverityRequest, SeverityResponse,
    PriorityRequest, PriorityResponse,
)
from app.schemas.gis import GeoJSONFeatureCollection, GeoJSONFeature, GeoJSONGeometry