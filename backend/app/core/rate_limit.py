import time
from collections import defaultdict
from fastapi import HTTPException, Request

GUEST_MAX_REQUESTS = 5
GUEST_WINDOW_SECONDS = 15 * 60  # 15 menit

_requests_by_ip: dict[str, list[float]] = defaultdict(list)


def check_guest_rate_limit(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    now = time.time()

    window_start = now - GUEST_WINDOW_SECONDS
    recent = [t for t in _requests_by_ip[ip] if t > window_start]

    if len(recent) >= GUEST_MAX_REQUESTS:
        retry_after_seconds = int(recent[0] + GUEST_WINDOW_SECONDS - now)
        raise HTTPException(
            status_code=429,
            detail=(
                "Terlalu banyak laporan tanpa akun dari perangkat ini dalam "
                f"waktu singkat. Coba lagi dalam {max(retry_after_seconds, 1)} detik, "
                "atau masuk/daftar akun supaya tidak dibatasi."
            ),
        )

    recent.append(now)
    _requests_by_ip[ip] = recent