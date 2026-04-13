from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Action, Lead
from sqlalchemy import and_
from datetime import datetime, date

def get_total_actions(db: Session, from_date: datetime = None, to_date: datetime = None) -> int:
    query = db.query(Action)
    if from_date:
        query = query.filter(Action.performed_at >= from_date)
    if to_date:
        query = query.filter(Action.performed_at < to_date)   # строго меньше, чтобы включить весь день
    return query.count()

def get_total_leads(db: Session, from_date: datetime = None, to_date: datetime = None) -> int:
    query = db.query(Lead)
    if from_date:
        query = query.filter(Lead.created_at >= from_date)
    if to_date:
        query = query.filter(Lead.created_at < to_date)
    return query.count()


def get_profiles_summary(db: Session, from_date: date, to_date: date):
    """
    Возвращает сводку по профилям: инвайты, принятые, сообщения, ответы и проценты.
    Фильтрует действия по диапазону дат (performed_at).
    """
    # Сдвигаем конечную дату на +1 день, чтобы поиск захватил весь последний день (до 23:59:59)
    # так как performed_at содержит время.
    from datetime import timedelta
    next_day = to_date + timedelta(days=1)
    
    sql = text("""
        SELECT 
            p.name,
            COUNT(*) FILTER (WHERE a.action_type = 'invited') AS invited,
            COUNT(*) FILTER (WHERE a.action_type = 'accepted') AS accepted,
            ROUND(
                COUNT(*) FILTER (WHERE a.action_type = 'accepted')::NUMERIC / 
                NULLIF(COUNT(*) FILTER (WHERE a.action_type = 'invited'), 0) * 100, 2
            ) AS acceptance_rate,
            COUNT(*) FILTER (WHERE a.action_type = 'message sent') AS messaged,
            COUNT(*) FILTER (WHERE a.action_type = 'replied') AS replied,
            ROUND(
                COUNT(*) FILTER (WHERE a.action_type = 'replied')::NUMERIC / 
                NULLIF(COUNT(*) FILTER (WHERE a.action_type = 'message sent'), 0) * 100, 2
            ) AS reply_rate
        FROM actions a
        LEFT JOIN profiles p ON a.profile_id = p.id
        WHERE a.performed_at >= :from_date AND a.performed_at < :next_day
        GROUP BY p.name
        ORDER BY p.name
    """)
    result = db.execute(sql, {"from_date": from_date, "next_day": next_day})
    # Превращаем результат в список словарей для удобства фронта
    return [
        {
            "profile_name": row.name,
            "invited": row.invited,
            "accepted": row.accepted,
            "acceptance_rate": row.acceptance_rate,
            "messaged": row.messaged,
            "replied": row.replied,
            "reply_rate": row.reply_rate
        }
        for row in result
    ]