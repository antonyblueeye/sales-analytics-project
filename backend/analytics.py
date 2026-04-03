from sqlalchemy.orm import Session
from models import Action, Lead

def get_total_actions(db: Session) -> int:
    """Возвращает общее количество действий в БД."""
    return db.query(Action).count()

def get_total_leads(db: Session) -> int:
    """Возвращает общее количество лидов в БД."""
    return db.query(Lead).count()