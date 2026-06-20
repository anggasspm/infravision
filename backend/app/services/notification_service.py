from sqlalchemy.orm import Session
from app.models.notification import Notification

def create_notification(db: Session, user_id: str, message: str, report_id: str = None) -> Notification:
    notif = Notification(user_id=user_id, report_id=report_id, message=message)
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
