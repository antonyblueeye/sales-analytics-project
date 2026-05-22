import sys
from functools import lru_cache
from database import SessionLocal
import os
# Добавляем текущую директорию в путь поиска модулей, чтобы импорты из этого же фолдера работали корректно
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Action, Lead, MessageTemplate, MessageTemplateMap, Campaign, Profile
from sqlalchemy import and_, func
from datetime import datetime, date, timedelta
from collections import defaultdict
import time
from typing import Optional, Any

# Simple global cache to store expensive analytics results
_analytics_cache = {}
CACHE_TTL = 300  # 5 minutes in seconds

def get_total_actions(db: Session, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None) -> int:
    query = db.query(Action)
    if from_date:
        query = query.filter(Action.performed_at >= from_date)
    if to_date:
        query = query.filter(Action.performed_at < to_date)
    return query.count()

def get_total_leads(db: Session, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None) -> int:
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
                trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) AS clean_campaign
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

def get_campaign_sequence(db: Session, campaign_name: Optional[str] = None):
    """
    Returns top message templates. 
    If campaign_name is 'ALL_CAMPAIGNS' or None, aggregates across all campaigns (Sent > 100).
    Otherwise, aggregates for a specific campaign group (Sent > 10).
    """
    is_global = not campaign_name or campaign_name == 'ALL_CAMPAIGNS'
    
    # 0. Check cache for global analytics
    if is_global:
        cache_key = "global_campaign_analytics"
        cached_val = _analytics_cache.get(cache_key)
        if cached_val and (time.time() - cached_val['timestamp'] < CACHE_TTL):
            return cached_val['data']
    
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
        func.max(MessageTemplate.template).label('template'),  # Representative template text
        func.min(MessageTemplate.id).label('representative_id'),
        func.min(MessageTemplate.step_index).label('min_step'),
        func.count(MessageTemplateMap.id).label('sent_count'),
        func.count(MessageTemplateMap.id).filter(MessageTemplateMap.replied == True).label('reply_count'),
        func.min(MessageTemplateMap.created_at).label('first_seen'),
        func.string_agg(distinct(Campaign.name), ', ').label('campaign_names'),
        func.array_agg(distinct(MessageTemplate.id)).label('template_ids')
    ).join(MessageTemplateMap, MessageTemplate.id == MessageTemplateMap.message_template_id)\
     .join(Campaign, MessageTemplate.campaign_id == Campaign.id)
    
    if not is_global:
        query = query.filter(MessageTemplate.campaign_id.in_(campaign_ids))
    
    # Adjust fetch threshold for global view to reduce number of rows processed
    fetch_threshold = 20 if is_global else 3
    # Limit the number of results after ordering to improve response time
    raw_results = query.group_by(normalized_text)\
                       .having(func.count(MessageTemplateMap.id) > fetch_threshold)\
                       .order_by(func.count(MessageTemplateMap.id).desc())\
                       .limit(100)\
                       .all()

    if not raw_results:
        return []

    # 3. Linear aggregation of results (no fuzzy merging)
    import re
    aggregated_results = []
    
    for row in raw_results:
        is_invite = (row.min_step == 0)
        title = "Invitation Template" if is_invite else "Outreach Message"
        
        # Clean campaign names: remove tags like [TAG] and limit number
        raw_names = row.campaign_names.split(', ') if row.campaign_names else []
        clean_names = sorted(list(set([re.sub(r'\s*(\[[^\]]*\]|\([^\)]*\))', '', n).strip() for n in raw_names])))
        
        aggregated_results.append({
            "id": row.representative_id,
            "title": title,
            "text": row.template,
            "date": row.first_seen.strftime("%d.%m.%Y") if row.first_seen else "N/A",
            "sent_count": row.sent_count,
            "reply_count": row.reply_count,
            "is_invite": is_invite,
            "campaigns": clean_names,
            "template_ids": row.template_ids,
        })

    # 4. Filter by the actual threshold and re-sort
    final_results = [m for m in aggregated_results if m["sent_count"] > threshold]
    final_results.sort(key=lambda x: x["sent_count"], reverse=True)

    # Cache the result if global
    if is_global:
        _analytics_cache["global_campaign_analytics"] = {
            'data': final_results,
            'timestamp': time.time()
        }

    return final_results

def get_custom_messages_analytics(db: Session, mode: str = 'replied', profile_names: Optional[list[Any]] = None):
    """
    Returns analytics for custom messages.
    mode: 'replied' or 'accepted'
    profile_names: optional list of profile names to filter by
    """
    is_accepted_mode = mode == 'accepted'
    
    profile_filter = ""
    if profile_names:
        profile_filter = "AND p.name IN :profile_names"

    if is_accepted_mode:
        sql = text(f"""
            WITH all_invited_actions AS (
                SELECT 
                    a.id,
                    a.lead_id,
                    a.campaign_id,
                    a.performed_at,
                    a.profile_id,
                    SUBSTRING(a.message FROM POSITION(',' IN a.message) + 1) as pattern
                FROM actions a
                WHERE a.action_type = 'invited'
                  AND a.message IS NOT NULL 
                  AND a.message <> 'Invite sent without message'
                  AND a.message <> ''
            ),
            pattern_counts AS (
                SELECT pattern, COUNT(*) as total_num
                FROM all_invited_actions
                GROUP BY pattern
            ),
            custom_invites_global AS (
                SELECT ia.*
                FROM all_invited_actions ia
                JOIN pattern_counts pc ON ia.pattern = pc.pattern
                WHERE pc.total_num < 8
            ),
            filtered_custom_invites AS (
                SELECT ci.*
                FROM custom_invites_global ci
                JOIN profiles p ON ci.profile_id = p.id
                WHERE 1=1 {profile_filter}
            ),
            acceptance_stats AS (
                SELECT 
                    fci.campaign_id,
                    COUNT(fci.id) as sent_count,
                    COUNT(DISTINCT a_acc.id) as accepted_count
                FROM filtered_custom_invites fci
                LEFT JOIN actions a_acc ON fci.lead_id = a_acc.lead_id 
                    AND fci.campaign_id = a_acc.campaign_id 
                    AND a_acc.action_type = 'accepted'
                    AND a_acc.performed_at > fci.performed_at
                GROUP BY fci.campaign_id
            )
            SELECT 
                trim(regexp_replace(c.name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) AS clean_campaign,
                SUM(ast.sent_count) as sent_count,
                SUM(ast.accepted_count) as success_count
            FROM acceptance_stats ast
            JOIN campaigns c ON ast.campaign_id = c.id
            GROUP BY clean_campaign
            ORDER BY sent_count DESC
        """)
    else:
        sql = text(f"""
            WITH global_custom_templates AS (
                SELECT message_template_id
                FROM message_templates_map
                GROUP BY message_template_id
                HAVING COUNT(*) = 1
            ),
            filtered_metrics AS (
                SELECT 
                    mt.campaign_id,
                    mtm.id as mapping_id,
                    mtm.replied
                FROM message_templates_map mtm
                JOIN global_custom_templates gct ON mtm.message_template_id = gct.message_template_id
                JOIN message_templates mt ON mtm.message_template_id = mt.id
                JOIN actions a ON mtm.action_id = a.id
                JOIN profiles p ON a.profile_id = p.id
                WHERE 1=1 {profile_filter}
            ),
            campaign_metrics AS (
                SELECT 
                    campaign_id,
                    COUNT(mapping_id) as custom_sent_count,
                    COUNT(mapping_id) FILTER (WHERE replied = TRUE) as custom_reply_count
                FROM filtered_metrics
                GROUP BY campaign_id
            )
            SELECT 
                trim(regexp_replace(c.name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) AS clean_campaign,
                SUM(cm.custom_sent_count) as sent_count,
                SUM(cm.custom_reply_count) as success_count
            FROM campaign_metrics cm
            JOIN campaigns c ON cm.campaign_id = c.id
            GROUP BY clean_campaign
            ORDER BY sent_count DESC
        """)
    
    params = {}
    if profile_names:
        params["profile_names"] = tuple(profile_names)
        
    result = db.execute(sql, params)
    return [
        {
            "campaign_name": row.clean_campaign,
            "sent_count": int(row.sent_count),
            "reply_count" if not is_accepted_mode else "accepted_count": int(row.success_count),
            "reply_rate" if not is_accepted_mode else "acceptance_rate": round((row.success_count / row.sent_count * 100), 2) if row.sent_count > 0 else 0
        }
        for row in result
    ]

def get_leads_analytics(db: Session, campaign_name: str = "all"):
    from collections import defaultdict
    
    title_mapping = {
        "Chief Executive Officer": "CEO",
        "Chief Technology Officer": "CTO",
        "Chief Operation Officer": "COO",
        "Chief Operating Officer": "COO",
        "Chief Financial Officer": "CFO",
        "Chief Marketing Officer": "CMO",
        "Vice President": "VP",
        "President": "President",
        "Founder": "Founder",
        "Co-Founder": "Co-Founder",
        "Managing Director": "MD",
        "Human Resources": "HR",
    }
    
    query = db.query(Lead.current_title, func.count(Lead.id).label('amount'))
    
    if campaign_name and campaign_name != "all":
        # Find campaign_ids matching clean_campaign or exact name
        res = db.execute(text("""
            SELECT id FROM campaigns 
            WHERE trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) = :name
        """), {"name": campaign_name})
        campaign_ids = [row[0] for row in res]
        
        if not campaign_ids:
            res = db.execute(text("SELECT id FROM campaigns WHERE name = :name"), {"name": campaign_name})
            campaign_ids = [row[0] for row in res]
            
        if campaign_ids:
            # Join with Action to filter leads that have actions in these campaigns
            query = query.join(Action, Lead.id == Action.lead_id).filter(Action.campaign_id.in_(campaign_ids))
            
    query = query.filter(Lead.current_title.isnot(None))\
                 .filter(Lead.current_title != '')\
                 .group_by(Lead.current_title)\
                 .order_by(func.count(Lead.id).desc())
                 
    raw_results = query.all()
    
    # Aggregate with mapping
    aggregated = defaultdict(int)
    for row in raw_results:
        title = row.current_title.strip()
        if not title:
            continue
            
        # Basic normalization for common acronyms if they appear in lowercase
        lower_title = title.lower()
        if lower_title in ["ceo", "cto", "coo", "cfo", "cmo", "vp", "hr", "md"]:
            mapped_title = lower_title.upper()
        else:
            mapped_title = title.title()
            
        # Map if matches long forms
        for key, val in title_mapping.items():
            if key.lower() in lower_title:
                mapped_title = val
                break
                
        aggregated[mapped_title] += row.amount
        
    # Sort and take top 5
    sorted_titles = sorted(aggregated.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return [
        {"title": k, "count": v}
        for k, v in sorted_titles
    ]

def get_replied_titles_analytics(db: Session, campaign_name: str = "all"):
    from collections import defaultdict
    
    title_mapping = {
        "Chief Executive Officer": "CEO",
        "Chief Technology Officer": "CTO",
        "Chief Operation Officer": "COO",
        "Chief Operating Officer": "COO",
        "Chief Financial Officer": "CFO",
        "Chief Marketing Officer": "CMO",
        "Vice President": "VP",
        "President": "President",
        "Founder": "Founder",
        "Co-Founder": "Co-Founder",
        "Managing Director": "MD",
        "Human Resources": "HR",
    }
    
    # We join Lead and Action from the start because we need action_type == 'replied'
    query = db.query(Lead.current_title, func.count(Action.id).label('amount'))\
              .join(Action, Lead.id == Action.lead_id)\
              .filter(Action.action_type == 'replied')
    
    if campaign_name and campaign_name != "all":
        # Find campaign_ids matching clean_campaign or exact name
        res = db.execute(text("""
            SELECT id FROM campaigns 
            WHERE trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) = :name
        """), {"name": campaign_name})
        campaign_ids = [row[0] for row in res]
        
        if not campaign_ids:
            res = db.execute(text("SELECT id FROM campaigns WHERE name = :name"), {"name": campaign_name})
            campaign_ids = [row[0] for row in res]
            
        if campaign_ids:
            query = query.filter(Action.campaign_id.in_(campaign_ids))
            
    query = query.filter(Lead.current_title.isnot(None))\
                 .filter(Lead.current_title != '')\
                 .group_by(Lead.current_title)\
                 .order_by(func.count(Action.id).desc())
                 
    raw_results = query.all()
    
    # Aggregate with mapping
    aggregated = defaultdict(int)
    for row in raw_results:
        title = row.current_title.strip()
        if not title:
            continue
            
        # Basic normalization for common acronyms if they appear in lowercase
        lower_title = title.lower()
        if lower_title in ["ceo", "cto", "coo", "cfo", "cmo", "vp", "hr", "md"]:
            mapped_title = lower_title.upper()
        else:
            mapped_title = title.title()
            
        # Map if matches long forms
        for key, val in title_mapping.items():
            if key.lower() in lower_title:
                mapped_title = val
                break
                
        aggregated[mapped_title] += row.amount
        
    # Sort and take top 5
    sorted_titles = sorted(aggregated.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return [
        {"title": k, "count": v}
        for k, v in sorted_titles
    ]

def get_locations_analytics(db: Session, campaign_name: str = "all"):
    import re
    from collections import defaultdict
    
    query = db.query(Lead.location, func.count(Lead.id).label('amount'))
    
    if campaign_name and campaign_name != "all":
        # Find campaign_ids matching clean_campaign or exact name
        res = db.execute(text("""
            SELECT id FROM campaigns 
            WHERE trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) = :name
        """), {"name": campaign_name})
        campaign_ids = [row[0] for row in res]
        
        if not campaign_ids:
            res = db.execute(text("SELECT id FROM campaigns WHERE name = :name"), {"name": campaign_name})
            campaign_ids = [row[0] for row in res]
            
        if campaign_ids:
            # Join with Action to filter leads that have actions in these campaigns
            query = query.join(Action, Lead.id == Action.lead_id).filter(Action.campaign_id.in_(campaign_ids))
            
    query = query.filter(Lead.location.isnot(None))\
                 .filter(Lead.location != '')\
                 .group_by(Lead.location)
                 
    raw_results = query.all()
    
    countries_map = {
        "united states": "United States of America",
        "usa": "United States of America",
        "u.s.": "United States of America",
        "u.s.a": "United States of America",
        "america": "United States of America",
        "united kingdom": "United Kingdom",
        "uk": "United Kingdom",
        "u.k.": "United Kingdom",
        "great britain": "United Kingdom",
        "england": "United Kingdom",
        "canada": "Canada",
        "australia": "Australia",
        "india": "India",
        "germany": "Germany",
        "france": "France",
        "italy": "Italy",
        "spain": "Spain",
        "brazil": "Brazil",
        "mexico": "Mexico",
        "netherlands": "Netherlands",
        "the netherlands": "Netherlands",
        "sweden": "Sweden",
        "poland": "Poland",
        "ukraine": "Ukraine",
        "russia": "Russia",
        "china": "China",
        "japan": "Japan",
        "south korea": "South Korea",
        "ireland": "Ireland",
        "switzerland": "Switzerland",
        "singapore": "Singapore",
        "belgium": "Belgium",
        "denmark": "Denmark",
        "norway": "Norway",
        "finland": "Finland",
        "austria": "Austria",
        "portugal": "Portugal",
        "israel": "Israel",
        "uae": "United Arab Emirates",
        "united arab emirates": "United Arab Emirates",
        "saudi arabia": "Saudi Arabia",
        "south africa": "South Africa",
        "argentina": "Argentina",
        "colombia": "Colombia",
        "chile": "Chile",
        "new zealand": "New Zealand",
        "philippines": "Philippines",
        "indonesia": "Indonesia",
        "malaysia": "Malaysia",
        "vietnam": "Vietnam",
        "thailand": "Thailand",
        "turkey": "Turkey",
        "egypt": "Egypt",
        "pakistan": "Pakistan",
        "bangladesh": "Bangladesh",
        "nigeria": "Nigeria",
        "kenya": "Kenya",
        "romania": "Romania",
        "czech republic": "Czechia",
        "czechia": "Czechia",
        "hungary": "Hungary",
        "greece": "Greece"
    }

    aggregated = defaultdict(int)
    
    for row in raw_results:
        loc = row.location.strip().lower()
        if not loc:
            continue
            
        found_country = None
        loc_clean = re.sub(r'[^a-z\s]', ' ', loc)
        words = set(loc_clean.split())
        
        # Check acronyms precisely
        if "uk" in words and "ukraine" not in loc:
            found_country = "United Kingdom"
        elif "usa" in words or "us" in words:
            found_country = "United States of America"
        elif "uae" in words:
            found_country = "United Arab Emirates"
        else:
            # Check longest phrases first
            for key, val in sorted(countries_map.items(), key=lambda x: len(x[0]), reverse=True):
                if key in loc:
                    found_country = val
                    break
                    
        if found_country:
            aggregated[found_country] += row.amount
            
    return [{"location": k, "count": v} for k, v in aggregated.items()]
