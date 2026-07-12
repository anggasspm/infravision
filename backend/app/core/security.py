import secrets
import string
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from app.core.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

oauth2_scheme = HTTPBearer()

oauth2_scheme_optional = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token bukan access token")
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token tidak valid")
        return {"id": user_id, "role": role}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid atau expired")


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme_optional),
):
    """Dipakai di endpoint yang boleh diakses tanpa login (mis. buat laporan
    tanpa akun), tapi tetap mengenali user kalau dia sedang login.

    - Tidak ada header Authorization sama sekali -> return None (tamu).
    - Header ada tapi token rusak/expired -> tetap 401 (jangan diam-diam
      dianggap tamu, supaya user yang sesi-nya expired sadar harus login
      ulang alih-alih laporannya kepencet jadi anonim tanpa disadari).
    """
    if credentials is None:
        return None
    return get_current_user(credentials)


def require_role(*allowed_roles: str):
    """Dependency factory untuk role guard, dipakai di endpoint admin/maintenance nanti."""
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Anda tidak memiliki akses untuk aksi ini"
            )
        return current_user
    return role_checker


_TRACKING_ALPHABET = "".join(c for c in string.ascii_uppercase + string.digits if c not in "01OI")


def generate_tracking_code() -> str:
    suffix = "".join(secrets.choice(_TRACKING_ALPHABET) for _ in range(6))
    return f"INV-{suffix}"