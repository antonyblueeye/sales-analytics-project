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
            ) AS reply_rate,
            COUNT(*) FILTER (WHERE a.action_type = 'interested') AS interested,
            COUNT(*) FILTER (WHERE a.action_type = 'call') AS calls,
            COUNT(*) FILTER (WHERE a.action_type = 'mql') AS mql,
            COUNT(*) FILTER (WHERE a.action_type = 'sql') AS sql,
            COUNT(*) FILTER (WHERE a.action_type = 'partner') AS partner,
            COUNT(*) FILTER (WHERE a.action_type = 'client') AS clients
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
            "reply_rate": row.reply_rate,
            "interested": row.interested,
            "calls": row.calls,
            "mql": row.mql,
            "sql": row.sql,
            "partner": row.partner,
            "clients": row.clients
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
            ), 0) as reply_rate,
            count(*) filter (where a.action_type = 'interested') as interested,
            count(*) filter (where a.action_type = 'call') as calls,
            count(*) filter (where a.action_type = 'mql') as mql,
            count(*) filter (where a.action_type = 'sql') as sql,
            count(*) filter (where a.action_type = 'partner') as partner,
            count(*) filter (where a.action_type = 'client') as clients
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
            "reply_rate": row.reply_rate,
            "interested": row.interested,
            "calls": row.calls,
            "mql": row.mql,
            "sql": row.sql,
            "partner": row.partner,
            "clients": row.clients
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

def get_campaign_sequence(db: Session, campaign_name: str = None):
    """
    Returns top message templates. 
    If campaign_name is 'ALL_CAMPAIGNS' or None, aggregates across all campaigns (Sent > 100).
    Otherwise, aggregates for a specific campaign group (Sent > 10).
    """
    is_global = not campaign_name or campaign_name == 'ALL_CAMPAIGNS'
    
    # 1. Determine campaign IDs (if not global)
    campaign_ids = []
    if not is_global:
        res = db.execute(text("""
            SELECT id FROM campaigns 
            WHERE trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) = :name
        """), {"name": campaign_name})
        campaign_ids = [row[0] for row in res]
        
        if not campaign_ids:
            res = db.execute(text("SELECT id FROM campaigns WHERE name = :name"), {"name": campaign_name})
            campaign_ids = [row[0] for row in res]
            if not campaign_ids: return []

    # 2. Query top templates, grouping by the normalized template text
    threshold = 100 if is_global else 10
    
    from sqlalchemy import distinct
    from difflib import SequenceMatcher
    
    def get_similarity(a: str, b: str) -> float:
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()
    
    # Normalize text by removing all non-alphanumeric characters and lowercasing
    normalized_text = func.lower(func.regexp_replace(MessageTemplate.template, '[^a-zA-Z0-9]', '', 'g'))
    
    query = db.query(
        func.max(MessageTemplate.template).label('template'), # Pick one version to display
        func.min(MessageTemplate.id).label('representative_id'),
        func.min(MessageTemplate.step_index).label('min_step'),
        func.count(MessageTemplateMap.id).label('sent_count'),
        func.count(MessageTemplateMap.id).filter(MessageTemplateMap.replied == True).label('reply_count'),
        func.min(MessageTemplateMap.created_at).label('first_seen'),
        func.string_agg(distinct(Campaign.name), ', ').label('campaign_names')
    ).join(MessageTemplateMap, MessageTemplate.id == MessageTemplateMap.message_template_id)\
     .join(Campaign, MessageTemplate.campaign_id == Campaign.id)
    
    if not is_global:
        query = query.filter(MessageTemplate.campaign_id.in_(campaign_ids))
    
    # We fetch everything > 15 (global) or > 3 (custom) to allow fragments to merge, but not overload Python
    fetch_threshold = 15 if is_global else 3
    raw_results = query.group_by(normalized_text)\
                       .having(func.count(MessageTemplateMap.id) > fetch_threshold)\
                       .order_by(func.count(MessageTemplateMap.id).desc())\
                       .all()

    if not raw_results:
        return []

    # 3. Fuzzy Merge & Format into a flat list
    import re
    merged_results = []
    
    for row in raw_results:
        is_invite = (row.min_step == 0)
        title = "Invitation Template" if is_invite else "Outreach Message"
        
        # Clean campaign names: remove tags like [TAG] and limit number
        raw_names = row.campaign_names.split(', ') if row.campaign_names else []
        clean_names = sorted(list(set([re.sub(r'\s*(\[[^\]]*\]|\([^\)]*\))', '', n).strip() for n in raw_names])))
        
        current_item = {
            "id": row.representative_id,
            "title": title,
            "text": row.template,
            "date": row.first_seen.strftime("%d.%m.%Y") if row.first_seen else "N/A",
            "sent_count": row.sent_count,
            "reply_count": row.reply_count,
            "is_invite": is_invite,
            "campaigns": clean_names
        }
        
        # Try to find a fuzzy match in already merged results
        found_match = False
        l1 = len(current_item["text"])
        
        for existing in merged_results:
            l2 = len(existing["text"])
            # Fast fail: if length difference is too big, they can't be 75% similar
            if l1 == 0 or l2 == 0 or abs(l1 - l2) / max(l1, l2) > 0.3:
                continue
                
            if get_similarity(current_item["text"], existing["text"]) >= 0.75: # 75% similarity threshold
                existing["sent_count"] += current_item["sent_count"]
                existing["reply_count"] += current_item["reply_count"]
                existing["campaigns"] = sorted(list(set(existing["campaigns"] + current_item["campaigns"])))
                
                # If we merged an invite, mark the whole group as invite
                if current_item["is_invite"]:
                    existing["is_invite"] = True
                    existing["title"] = "Invitation Template"
                
                # Keep the longer text as representative (often the one with the extra intro is better)
                if len(current_item["text"]) > len(existing["text"]):
                    existing["text"] = current_item["text"]
                
                found_match = True
                break
                
        if not found_match:
            merged_results.append(current_item)

    # 4. Filter by the actual threshold and re-sort
    final_results = [m for m in merged_results if m["sent_count"] > threshold]
    final_results.sort(key=lambda x: x["sent_count"], reverse=True)

    return final_results

