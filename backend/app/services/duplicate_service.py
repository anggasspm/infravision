from math import radians, sin, cos, sqrt, atan2
from io import BytesIO
from typing import Optional, List, Tuple
import requests
from PIL import Image
import imagehash

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000  # radius bumi dalam meter
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))

def get_phash(image_url: str) -> Optional[imagehash.ImageHash]:
    """Unduh gambar & hitung perceptual hash. None kalau URL gagal diakses/bukan gambar valid."""
    try:
        resp = requests.get(image_url, timeout=5)
        resp.raise_for_status()
        img = Image.open(BytesIO(resp.content))
        return imagehash.phash(img)
    except Exception:
        return None

def image_similarity(hash_a: imagehash.ImageHash, hash_b: imagehash.ImageHash) -> float:
    """0.0-1.0, 1.0 = identik. phash default 64-bit (8x8)."""
    max_bits = len(hash_a.hash) ** 2
    distance = hash_a - hash_b
    return 1 - (distance / max_bits)

def find_duplicate(
    new_lat: float,
    new_lon: float,
    new_image_url: str,
    candidates: List[Tuple[str, float, float, str]],  # (report_id, lat, lon, image_url)
    radius_meters: float = 50,
    similarity_threshold: float = 0.85,
):
    """
    Duplikat = berada dalam radius_meters DAN kemiripan gambar >= similarity_threshold.
    Return: (is_duplicate, matched_report_id, distance_meters, similarity)
    """
    nearby = [
        (rid, haversine_distance_meters(new_lat, new_lon, lat, lon), image_url)
        for rid, lat, lon, image_url in candidates
    ]
    nearby = [n for n in nearby if n[1] <= radius_meters]

    if not nearby:
        return False, None, None, None

    new_hash = get_phash(new_image_url)
    if new_hash is None:
        # Gambar baru tidak bisa diproses -> tidak bisa pastikan duplikat lewat gambar
        closest = min(nearby, key=lambda x: x[1])
        return False, None, closest[1], None

    best_match = None
    for report_id, distance, image_url in nearby:
        other_hash = get_phash(image_url)
        if other_hash is None:
            continue
        similarity = image_similarity(new_hash, other_hash)
        if similarity >= similarity_threshold and (best_match is None or similarity > best_match[2]):
            best_match = (report_id, distance, similarity)

    if best_match:
        return True, best_match[0], best_match[1], best_match[2]

    closest = min(nearby, key=lambda x: x[1])
    return False, None, closest[1], None