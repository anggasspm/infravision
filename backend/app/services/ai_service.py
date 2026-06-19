import random
from infravision.backend.app.schemas.ai import DAMAGE_CATEGORIES, BoundingBox


def mock_classify(image_url: str) -> tuple[str, float, BoundingBox]:
    """
    STUB: YOLOv8 belum terintegrasi. Fungsi ini mensimulasikan hasil deteksi
    supaya endpoint /ai/classify dan pipeline /reports bisa dites end-to-end.
    Ganti isi fungsi ini dengan inference YOLOv8 asli saat model sudah siap —
    signature (return category, confidence, bbox) tidak perlu diubah.
    """
    category = random.choice(DAMAGE_CATEGORIES)
    confidence = round(random.uniform(0.65, 0.97), 4)
    bbox = BoundingBox(
        x_min=round(random.uniform(0.05, 0.4), 4),
        y_min=round(random.uniform(0.05, 0.4), 4),
        x_max=round(random.uniform(0.5, 0.95), 4),
        y_max=round(random.uniform(0.5, 0.95), 4),
    )
    return category, confidence, bbox


SEVERITY_KEYWORDS = {
    "critical": ["parah", "bahaya", "ambruk", "longsor", "rusak total"],
    "high": ["besar", "dalam", "luas"],
}


def assess_severity(bbox: BoundingBox, description: str) -> tuple[str, float]:
    """Rule-based severity: luas bbox relatif terhadap frame + keyword di deskripsi."""
    area_ratio = max(0.0, (bbox.x_max - bbox.x_min) * (bbox.y_max - bbox.y_min))

    if area_ratio < 0.05:
        severity = "low"
    elif area_ratio < 0.15:
        severity = "medium"
    elif area_ratio < 0.30:
        severity = "high"
    else:
        severity = "critical"

    desc_lower = description.lower()
    if any(word in desc_lower for word in SEVERITY_KEYWORDS["critical"]):
        severity = "critical"
    elif severity in ("low", "medium") and any(word in desc_lower for word in SEVERITY_KEYWORDS["high"]):
        severity = "high"

    return severity, round(area_ratio, 4)


SEVERITY_WEIGHTS = {"low": 25, "medium": 50, "high": 75, "critical": 100}


def calculate_priority(
    severity: str,
    report_frequency: int = 0,
    location_importance: float = 50,
    age_hours: float = 0,
) -> tuple[int, str]:
    """Formula PRD: (severity*40%) + (freq*25%) + (loc*20%) + (age*15%), normalisasi 0-100."""
    severity_score = SEVERITY_WEIGHTS.get(severity.lower(), 50)
    freq_score = min(report_frequency * 10, 100)
    loc_score = min(max(location_importance, 0), 100)
    age_score = min((age_hours / 24) * 10, 100)

    score = (severity_score * 0.40) + (freq_score * 0.25) + (loc_score * 0.20) + (age_score * 0.15)
    score = round(min(max(score, 0), 100))

    if score < 40:
        level = "low"
    elif score < 60:
        level = "medium"
    elif score < 80:
        level = "high"
    else:
        level = "critical"

    return score, level
