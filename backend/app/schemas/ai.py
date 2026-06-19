from pydantic import BaseModel, Field

# TODO: sesuaikan dengan 6 kategori final di dropdown frontend (Orang 1)
DAMAGE_CATEGORIES = [
    "Jalan Berlubang",
    "Retak Jalan/Bangunan",
    "Lampu Jalan Rusak",
    "Saluran Air Tersumbat",
    "Trotoar Rusak",
    "Lainnya",
]

class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float

class ClassifyRequest(BaseModel):
    image_url: str

class ClassifyResponse(BaseModel):
    category: str
    confidence: float
    bbox: BoundingBox

class SeverityRequest(BaseModel):
    bbox: BoundingBox
    description: str = ""

class SeverityResponse(BaseModel):
    severity: str
    area_ratio: float

class PriorityRequest(BaseModel):
    severity: str
    report_frequency: int = Field(0, ge=0, description="Jumlah laporan serupa di lokasi yang sama")
    location_importance: float = Field(50, ge=0, le=100, description="Skor kepentingan lokasi (default 50)")
    age_hours: float = Field(0, ge=0, description="Lama waktu sejak laporan dibuat (jam)")

class PriorityResponse(BaseModel):
    priority_score: int
    priority_level: str