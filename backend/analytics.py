import sys
import os
# Добавляем текущую директорию в путь поиска модулей, чтобы импорты из этого же фолдера работали корректно
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Action, Lead, MessageTemplate, MessageTemplateMap, Campaign, Profile
from sqlalchemy import and_, func
from datetime import datetime, date, timedelta
from collections import defaultdict

def get_total_actions(db: Session, from_date: datetime = None, to_date: datetime = None) -> int:
    query = db.query(Action)
    if from_date:
        query = query.filter(Action.performed_at >= from_date)
    if to_date:
        query = query.filter(Action.performed_at < to_date)
    return query.count()

def get_total_leads(db: Session, from_date: datetime = None, to_date: datetime = None) -> int:
    query = db.query(Lead)
    if from_date:
        query = query.filter(Lead.created_at >= from_date)
    if to_date:
        query = query.filter(Lead.created_at < to_date)
    return query.count()

def get_profiles_summary(db: Session, from_date: date, to_date: date):
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

def get_campaigns_summary(db: Session, from_date: date, to_date: date):
    next_day = to_date + timedelta(days=1)
    sql = text("""
        with clean_campaigns as (
            select 
                id,
                trim(regexp_replace(name, '\s*(\[[^\]]*\]|\([^\)]*\))', '', 'g')) AS clean_campaign
            from campaigns
        )
        select 
            cc.clean_campaign,
            p.name,
            count(*) filter (where a.action_type = 'invited') as invited,
            count(*) filter (where a.action_type = 'accepted') as accepted,
            coalesce(round(
                count(*) filter (where a.action_type = 'accepted')::numeric / 
                nullif(count(*) filter (where a.action_type = 'invited'), 0) * 100, 2
            ), 0) as acceptance_rate,
            count(*) filter (where a.action_type = 'message sent') as messaged,
            count(*) filter (where a.action_type = 'replied') as replied,
            coalesce(round(
                count(*) filter (where a.action_type = 'replied')::numeric / 
                nullif(count(*) filter (where a.action_type = 'message sent'), 0) * 100, 2
            ), 0) as reply_rate
        from actions a
        left join clean_campaigns cc on a.campaign_id = cc.id
        left join profiles p on a.profile_id = p.id
        where a.performed_at >= :from_date and a.performed_at < :next_day
        group by cc.clean_campaign, p.name
        order by p.name;    
    """)
    result = db.execute(sql, {"from_date": from_date, "next_day": next_day})
    return [
        {
            "campaign_name": row.clean_campaign,
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

def get_campaigns_list(db: Session):
    sql = text("""
        SELECT DISTINCT trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) AS clean_campaign
        FROM campaigns
        WHERE name IS NOT NULL
        ORDER BY clean_campaign
    """)
    result = db.execute(sql)
    return [row.clean_campaign for row in result if row.clean_campaign]

def get_campaign_history(db: Session, campaign_name: str, granularity: str):
    if granularity not in ['day', 'week', 'month']:
        granularity = 'day'
    sql = text(f"""
        WITH clean_campaigns AS (
            SELECT 
                id,
                trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) AS clean_campaign
            FROM campaigns
        )
        SELECT 
            date_trunc('{granularity}', a.performed_at) as period,
            COUNT(*) FILTER (WHERE a.action_type = 'invited') AS invited,
            COUNT(*) FILTER (WHERE a.action_type = 'accepted') AS accepted,
            COUNT(*) FILTER (WHERE a.action_type = 'message sent') AS messaged,
            COUNT(*) FILTER (WHERE a.action_type = 'replied') AS replied
        FROM actions a
        JOIN clean_campaigns cc ON a.campaign_id = cc.id
        WHERE cc.clean_campaign = :campaign_name
        GROUP BY period
        ORDER BY period
    """)
    result = db.execute(sql, {"campaign_name": campaign_name})
    return [
        {
            "period": row.period.isoformat(),
            "invited": row.invited,
            "accepted": row.accepted,
            "messaged": row.messaged,
            "replied": row.replied
        }
        for row in result
    ]

def get_daily_summary(db: Session, from_date: date, to_date: date):
    next_day = to_date + timedelta(days=1)
    sql = text("""
        SELECT 
            date_trunc('day', a.performed_at) as date,
            COUNT(*) FILTER (WHERE a.action_type = 'invited') AS invites,
            COUNT(*) FILTER (WHERE a.action_type = 'accepted') AS accepted,
            COUNT(*) FILTER (WHERE a.action_type = 'message sent') AS messages,
            COUNT(*) FILTER (WHERE a.action_type = 'replied') AS replies
        FROM actions a
        WHERE a.performed_at >= :from_date AND a.performed_at < :next_day
        GROUP BY date
        ORDER BY date
    """)
    result = db.execute(sql, {"from_date": from_date, "next_day": next_day})
    return [
        {
            "date": row.date.date().isoformat(),
            "invites": row.invites,
            "accepted": row.accepted,
            "messages": row.messages,
            "replies": row.replies
        }
        for row in result
    ]

def get_recent_replies(db: Session, from_date: date, to_date: date):
    import re
    next_day = to_date + timedelta(days=1)
    results = db.query(Action, Lead, Campaign, Profile)\
        .join(Lead, Action.lead_id == Lead.id)\
        .outerjoin(Campaign, Action.campaign_id == Campaign.id)\
        .outerjoin(Profile, Action.profile_id == Profile.id)\
        .filter(Action.action_type == 'replied')\
        .filter(func.date(Action.performed_at) >= from_date)\
        .filter(func.date(Action.performed_at) <= to_date)\
        .order_by(Action.performed_at.desc())\
        .limit(200).all()
    
    def clean_name(name):
        if not name: return "N/A"
        cleaned = re.sub(r'\s*[\[\(].*?[\]\)]', '', name)
        return cleaned.strip() or name
    
    return [
        {
            "first_name": row.Lead.first_name,
            "last_name": row.Lead.last_name,
            "photo_url": row.Lead.photo_url,
            "linkedin_url": row.Lead.linkedin_url,
            "message": row.Action.message or "",
            "performed_at": row.Action.performed_at.isoformat(),
            "campaign_name": clean_name(row.Campaign.name if row.Campaign else None),
            "profile_name": (row.Profile.name if row.Profile else "Unknown")
        }
        for row in results
    ]

def get_campaign_sequence(db: Session, campaign_name: str):
    """
    Returns top message templates for a campaign (sent > 10), 
    aggregated by template text across all sequence steps.
    """
    # 1. Find campaign IDs that match the (already cleaned) name from frontend
    res = db.execute(text("""
        SELECT id FROM campaigns 
        WHERE trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) = :name
    """), {"name": campaign_name})
    campaign_ids = [row[0] for row in res]
    
    if not campaign_ids:
        res = db.execute(text("SELECT id FROM campaigns WHERE name = :name"), {"name": campaign_name})
        campaign_ids = [row[0] for row in res]
        if not campaign_ids: return []

    # 2. Query top templates (Sent > 10), grouping by the template text itself
    query = db.query(
        MessageTemplate.template,
        func.min(MessageTemplate.id).label('representative_id'),
        func.min(MessageTemplate.step_index).label('min_step'),
        func.count(MessageTemplateMap.id).label('sent_count'),
        func.count(MessageTemplateMap.id).filter(MessageTemplateMap.replied == True).label('reply_count'),
        func.min(MessageTemplateMap.created_at).label('first_seen')
    ).join(MessageTemplateMap, MessageTemplate.id == MessageTemplateMap.message_template_id)\
     .filter(MessageTemplate.campaign_id.in_(campaign_ids))\
     .group_by(MessageTemplate.template)\
     .having(func.count(MessageTemplateMap.id) > 10)\
     .order_by(func.count(MessageTemplateMap.id).desc())\
     .all()

    if not query:
        return []

    # 3. Format into a flat list
    result = []
    for row in query:
        is_invite = (row.min_step == 0)
        # Using a generic title if it's found at multiple steps, or "Invitation" if it's used as one
        title = "Invitation Template" if is_invite else "Outreach Message"
        
        result.append({
            "id": row.representative_id,
            "title": title,
            "text": row.template,
            "date": row.first_seen.strftime("%d.%m.%Y") if row.first_seen else "N/A",
            "sent_count": row.sent_count,
            "reply_count": row.reply_count,
            "is_invite": is_invite
        })

    return result
