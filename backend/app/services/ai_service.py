import random
from infravision.backend.app.schemas.ai import DAMAGE_CATEGORIES, BoundingBox

import os
import tempfile
from pathlib import Path

import requests
from ultralytics import YOLO

from app.schemas.ai import DAMAGE_CATEGORIES, BoundingBox

# === Load model sekali saat startup, dipakai ulang untuk semua request ===
MODEL_PATH = Path(__file__).parent.parent / "ml_models" / "best.pt"

_model = None

def get_model():
    """Lazy load model — hanya load sekali ke memory, bukan tiap request."""
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model tidak ditemukan di {MODEL_PATH}. "
                "Pastikan best.pt sudah ditaruh di backend/app/ml_models/"
            )
        _model = YOLO(str(MODEL_PATH))
    return _model


# Mapping nama kelas hasil training (CRDDC2022) ke kategori InfraVision
CLASS_NAME_MAPPING = {
    "D00": "Road Damage",   # longitudinal crack
    "D10": "Road Damage",   # transverse crack
    "D20": "Road Damage",   # alligator crack
    "D40": "Pothole",       # pothole
    "D43": "Road Damage",   # cross walk blur / lainnya
    "D44": "Road Damage",   # white line blur
    "D50": "Road Damage",   # manhole cover
}


def download_image_temp(image_url: str) -> str:
    """Download gambar dari URL (Cloudinary/S3) ke file temporary lokal untuk inference."""
    response = requests.get(image_url, timeout=10)
    response.raise_for_status()

    suffix = Path(image_url).suffix or ".jpg"
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp_file.write(response.content)
    tmp_file.close()
    return tmp_file.name


def classify_image(image_path: str) -> tuple[str, float, BoundingBox | None]:
    """
    Jalankan inference YOLOv8 pada gambar dan return (kategori, confidence, bbox).
    image_path: path file lokal (hasil download_image_temp).
    """
    model = get_model()
    results = model.predict(image_path, conf=0.25, verbose=False)

    if len(results) == 0 or len(results[0].boxes) == 0:
        return "Unclassified", 0.0, None

    result = results[0]
    img_h, img_w = result.orig_shape

    best_idx = result.boxes.conf.argmax().item()
    best_box = result.boxes[best_idx]

    confidence = round(float(best_box.conf[0]), 4)
    class_id = int(best_box.cls[0])
    raw_class_name = model.names[class_id]
    category = CLASS_NAME_MAPPING.get(raw_class_name, raw_class_name)

    x1, y1, x2, y2 = best_box.xyxy[0].tolist()
    bbox = BoundingBox(
        x_min=round(x1 / img_w, 4),
        y_min=round(y1 / img_h, 4),
        x_max=round(x2 / img_w, 4),
        y_max=round(y2 / img_h, 4),
    )

    return category, confidence, bbox


# Dipertahankan untuk kompatibilitas / testing tanpa model asli
def mock_classify(image_url: str) -> tuple[str, float, BoundingBox]:
    """DEPRECATED: gunakan classify_image() untuk inference YOLOv8 asli."""
    import random
    category = random.choice(DAMAGE_CATEGORIES)
    confidence = round(random.uniform(0.65, 0.97), 4)
    bbox = BoundingBox(
        x_min=round(random.uniform(0.05, 0.4), 4),
        y_min=round(random.uniform(0.05, 0.4), 4),
        x_max=round(random.uniform(0.5, 0.95), 4),
        y_max=round(random.uniform(0.5, 0.95), 4),
    )
    return category, confidence, bbox


# === Severity & Priority — tidak berubah dari sebelumnya ===

SEVERITY_KEYWORDS = {
    "critical": ["parah", "bahaya", "ambruk", "longsor", "rusak total"],
    "high": ["besar", "dalam", "luas"],
}


def assess_severity(bbox: BoundingBox, description: str) -> tuple[str, float]:
    if bbox is None:
        return "low", 0.0

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
