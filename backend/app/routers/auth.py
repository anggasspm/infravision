from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import JWTError
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserRegister, UserLogin, TokenResponse, UserResponse,
    RefreshRequest, AccessTokenResponse
)
from app.schemas.common import SuccessResponse
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token, get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=SuccessResponse[TokenResponse], status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    user = User(
        name=data.name,
        email=data.email.lower(),
        password_hash=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id, "role": user.role})
    token_data = TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserResponse.from_orm(user))
    return SuccessResponse(data=token_data, message="Registrasi berhasil")


@router.post("/login", response_model=SuccessResponse[TokenResponse])
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email atau password salah")

    access_token = create_access_token({"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id, "role": user.role})
    token_data = TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserResponse.from_orm(user))
    return SuccessResponse(data=token_data, message="Login berhasil")


@router.post("/refresh", response_model=SuccessResponse[AccessTokenResponse])
def refresh_access_token(data: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(data.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token tidak valid atau expired")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token bukan refresh token")

    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    new_access_token = create_access_token({"sub": user.id, "role": user.role})
    return SuccessResponse(data=AccessTokenResponse(access_token=new_access_token), message="Token berhasil diperbarui")


@router.get("/me", response_model=SuccessResponse[UserResponse])
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return SuccessResponse(data=UserResponse.from_orm(user), message="OK")
