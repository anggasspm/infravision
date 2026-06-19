from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.schemas.common import SuccessResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=SuccessResponse[NotificationListResponse])
def list_notifications(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user["id"])
        .order_by(Notification.created_at.desc())
        .all()
    )
    unread_count = sum(1 for n in notifications if not n.is_read)
    result = NotificationListResponse(total=len(notifications), unread_count=unread_count, items=notifications)
    return SuccessResponse(data=result, message="OK")

@router.put("/{notification_id}/read", response_model=SuccessResponse[NotificationResponse])
def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user["id"])
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan")

    notification.is_read = True
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return SuccessResponse(data=NotificationResponse.from_orm(notification), message="Notifikasi ditandai sudah dibaca")