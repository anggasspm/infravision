from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.report import Report
from app.schemas.gis import GeoJSONFeatureCollection, GeoJSONFeature, GeoJSONGeometry
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/map", tags=["GIS"])


@router.get("/reports", response_model=SuccessResponse[GeoJSONFeatureCollection])
def get_reports_geojson(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)
    if severity:
        query = query.filter(Report.severity == severity)
    if category:
        query = query.filter(Report.category == category)

    reports = query.all()
    features = [
        GeoJSONFeature(
            geometry=GeoJSONGeometry(coordinates=[r.longitude, r.latitude]),
            properties={
                "id": r.id,
                "category": r.category,
                "severity": r.severity,
                "status": r.status,
                "priority_score": r.priority_score,
                "is_duplicate": r.is_duplicate,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            },
        )
        for r in reports
    ]
    result = GeoJSONFeatureCollection(features=features)
    return SuccessResponse(data=result, message="OK")
