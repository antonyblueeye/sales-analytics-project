import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Action, Lead
from sqlalchemy import and_
from datetime import datetime, date
import uuid
from typing import Optional, Any, Dict
from fastapi import HTTPException
from models import Campaign, Profile, Action

def get_leads_list(
    db: Session, 
    page: int = 1, 
    limit: int = 20, 
    search: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    company: Optional[str] = None,
    location: Optional[str] = None,
    title: Optional[str] = None,
    create_date_from: Optional[str] = None,
    create_date_to: Optional[str] = None,
    activity_date_from: Optional[str] = None,
    activity_date_to: Optional[str] = None,
    campaign: Optional[str] = None,
    status: Optional[str] = None
):
    offset = (page - 1) * limit
    
    where_clauses: list[str] = []
    params: Dict[str, Any] = {"offset": offset, "limit": limit}
    
    if search:
        where_clauses.append("(l.first_name ILIKE :search OR l.last_name ILIKE :search OR (l.first_name || ' ' || l.last_name) ILIKE :search OR l.current_employer ILIKE :search)")
        params["search"] = f"%{search}%"
    
    if first_name:
        where_clauses.append("l.first_name ILIKE :fn")
        params["fn"] = f"%{first_name}%"
    if last_name:
        where_clauses.append("l.last_name ILIKE :ln")
        params["ln"] = f"%{last_name}%"
    if company:
        where_clauses.append("l.current_employer ILIKE :comp")
        params["comp"] = f"%{company}%"
    if location:
        where_clauses.append("l.location ILIKE :loc")
        params["loc"] = f"%{location}%"
    if title:
        where_clauses.append("l.current_title ILIKE :ttl")
        params["ttl"] = f"%{title}%"

    if create_date_from:
        where_clauses.append("(l.id IN (SELECT lead_id FROM actions GROUP BY lead_id HAVING MIN(performed_at) >= :c_from) OR (NOT EXISTS (SELECT 1 FROM actions WHERE lead_id = l.id) AND l.created_at >= :c_from))")
        params["c_from"] = create_date_from
    if create_date_to:
        where_clauses.append("(l.id IN (SELECT lead_id FROM actions GROUP BY lead_id HAVING MIN(performed_at) <= :c_to) OR (NOT EXISTS (SELECT 1 FROM actions WHERE lead_id = l.id) AND l.created_at <= :c_to))")
        params["c_to"] = create_date_to
        
    if activity_date_from:
        where_clauses.append("l.id IN (SELECT lead_id FROM actions GROUP BY lead_id HAVING MAX(performed_at) >= :a_from)")
        params["a_from"] = activity_date_from
    if activity_date_to:
        where_clauses.append("l.id IN (SELECT lead_id FROM actions GROUP BY lead_id HAVING MAX(performed_at) <= :a_to)")
        params["a_to"] = activity_date_to
        
    if campaign:
        where_clauses.append("EXISTS (SELECT 1 FROM actions act JOIN campaigns c ON act.campaign_id = c.id WHERE act.lead_id = l.id AND c.name ILIKE :camp)")
        params["camp"] = f"%{campaign}%"

    if status:
        s = status.lower()
        if s == 'new':
            where_clauses.append("NOT EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id)")
        elif s == 'pending':
            where_clauses.append("EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id AND act.action_type = 'invited') AND NOT EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id AND act.action_type IN ('accepted','replied','interested','mql','sql','partner','client'))")
        elif s == 'connected':
            where_clauses.append("EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id AND act.action_type = 'accepted') AND NOT EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id AND act.action_type IN ('replied','interested','mql','sql','partner','client'))")
        elif s == 'engaged':
            where_clauses.append("EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id AND act.action_type = 'replied') AND NOT EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id AND act.action_type IN ('interested','mql','sql','partner','client'))")
        else:
            where_clauses.append("EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id AND act.action_type = :status_val)")
            params["status_val"] = s

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)
        
    # Get total count with filters
    count_query = text(f"SELECT count(*) FROM leads l {where_sql}")
    total_count = db.execute(count_query, params).scalar()
    
    # FETCH LEADS with STATUS derived from actions
    query = text(f"""
        SELECT
            l.id,
            coalesce(l.first_name, '') as first_name,
            coalesce(l.last_name, '') as last_name,
            coalesce(CASE WHEN l.work_email LIKE '%@%' THEN l.work_email ELSE '' END, '') as email,
            coalesce(l.linkedin_url, '') as linkedin_url,
            coalesce(l.photo_url, '') as photo_url,
            coalesce(l.current_employer, '') as company_name,
            coalesce(l.current_title, '') as title,
            coalesce(l.location, '') as location,
            COALESCE(st.status, 'New') as status,
            COALESCE(st.campaign_names, ARRAY[]::text[]) as campaign_names,
            COALESCE(st.profile_names, ARRAY[]::text[]) as profile_names,
            COALESCE(st.first_action_at, l.created_at) as created_at
        FROM leads l
        LEFT JOIN (
            SELECT a.lead_id, 
                   MIN(a.performed_at) as first_action_at,
                   CASE
                WHEN COUNT(CASE WHEN a.action_type = 'client'    THEN 1 END) > 0 THEN 'Client'
                WHEN COUNT(CASE WHEN a.action_type = 'partner'   THEN 1 END) > 0 THEN 'Partner'
                WHEN COUNT(CASE WHEN a.action_type = 'sql'       THEN 1 END) > 0 THEN 'SQL'
                WHEN COUNT(CASE WHEN a.action_type = 'mql'       THEN 1 END) > 0 THEN 'MQL'
                WHEN COUNT(CASE WHEN a.action_type = 'interested' THEN 1 END) > 0 THEN 'Interested'
                WHEN COUNT(CASE WHEN a.action_type = 'replied'   THEN 1 END) > 0 THEN 'Engaged'
                WHEN COUNT(CASE WHEN a.action_type = 'accepted'  THEN 1 END) > 0 THEN 'Connected'
                WHEN COUNT(CASE WHEN a.action_type = 'invited'   THEN 1 END) > 0 THEN 'Pending'
                ELSE 'New'
            END as status,
                   array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as campaign_names,
                   array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL) as profile_names
            FROM actions a
            LEFT JOIN campaigns c ON a.campaign_id = c.id
            LEFT JOIN profiles p ON a.profile_id = p.id
            GROUP BY a.lead_id
        ) st ON l.id = st.lead_id
        {where_sql}
        ORDER BY l.id
        OFFSET :offset LIMIT :limit
    """)
    
    result = db.execute(query, params)
    leads_list = []
    for row in result:
        row_dict = dict(row._mapping)
        if row_dict.get('created_at'):
            if isinstance(row_dict['created_at'], (date, datetime)):
                row_dict['created_at'] = row_dict['created_at'].isoformat()
        leads_list.append(row_dict)
    
    if not leads_list:
        return {"leads": [], "total": 0, "page": page, "limit": limit}

    lead_ids = [l['id'] for l in leads_list]
    
    # FETCH MESSAGES for these leads to populate the Correspondence drawer
    msg_query = text("""
        SELECT a.lead_id, a.message, a.action_type, a.performed_at, p.name as profile_name
        FROM actions a
        LEFT JOIN profiles p ON a.profile_id = p.id
        WHERE a.lead_id IN :lead_ids AND a.message <> ''
        ORDER BY a.performed_at ASC
    """)
    msg_res = db.execute(msg_query, {"lead_ids": tuple(lead_ids)})
    
    # Map messages to leads
    messages_by_lead = {}
    for row in msg_res:
        r = row._mapping
        lid = r['lead_id']
        if lid not in messages_by_lead:
            messages_by_lead[lid] = []
        messages_by_lead[lid].append({
            "role": "lead" if r['action_type'] == 'replied' else "me",
            "text": r['message'],
            "profile_name": r['profile_name'] or 'Unknown',
            "timestamp": r['performed_at'].strftime('%H:%M %d.%m.%Y') if r['performed_at'] else ''
        })

    # Attach messages to lead objects
    for lead in leads_list:
        lead['messages'] = messages_by_lead.get(lead['id'], [])
        # Ensure arrays are lists (PostgreSQL returns them as Python lists already)
        lead['campaign_names'] = lead.get('campaign_names') or []
        lead['profile_names'] = lead.get('profile_names') or []
    
    return {
        "leads": leads_list,
        "total": total_count,
        "page": page,
        "limit": limit
    }

def get_replied_leads(
    db: Session, 
    page: int = 1, 
    limit: int = 20,
    search: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    company: Optional[str] = None,
    location: Optional[str] = None,
    title: Optional[str] = None,
    create_date_from: Optional[str] = None,
    create_date_to: Optional[str] = None,
    activity_date_from: Optional[str] = None,
    activity_date_to: Optional[str] = None,
    campaign: Optional[str] = None,
    status: Optional[str] = None
):
    offset = (page - 1) * limit
    
    where_clauses: list[str] = ["a.action_type = 'replied'"]
    params: Dict[str, Any] = {"offset": offset, "limit": limit}
    
    # ... previous filters ...
    if search:
        where_clauses.append("(l.first_name ILIKE :search OR l.last_name ILIKE :search OR (l.first_name || ' ' || l.last_name) ILIKE :search OR l.current_employer ILIKE :search)")
        params["search"] = f"%{search}%"
    
    if first_name:
        where_clauses.append("l.first_name ILIKE :fn")
        params["fn"] = f"%{first_name}%"
    if last_name:
        where_clauses.append("l.last_name ILIKE :ln")
        params["ln"] = f"%{last_name}%"
    if company:
        where_clauses.append("l.current_employer ILIKE :comp")
        params["comp"] = f"%{company}%"
    if location:
        where_clauses.append("l.location ILIKE :loc")
        params["loc"] = f"%{location}%"
    if title:
        where_clauses.append("l.current_title ILIKE :ttl")
        params["ttl"] = f"%{title}%"

    if create_date_from:
        where_clauses.append("(l.id IN (SELECT lead_id FROM actions GROUP BY lead_id HAVING MIN(performed_at) >= :c_from) OR (NOT EXISTS (SELECT 1 FROM actions WHERE lead_id = l.id) AND l.created_at >= :c_from))")
        params["c_from"] = create_date_from
    if create_date_to:
        where_clauses.append("(l.id IN (SELECT lead_id FROM actions GROUP BY lead_id HAVING MIN(performed_at) <= :c_to) OR (NOT EXISTS (SELECT 1 FROM actions WHERE lead_id = l.id) AND l.created_at <= :c_to))")
        params["c_to"] = create_date_to
        
    if activity_date_from:
        where_clauses.append("l.id IN (SELECT lead_id FROM actions GROUP BY lead_id HAVING MAX(performed_at) >= :a_from)")
        params["a_from"] = activity_date_from
    if activity_date_to:
        where_clauses.append("l.id IN (SELECT lead_id FROM actions GROUP BY lead_id HAVING MAX(performed_at) <= :a_to)")
        params["a_to"] = activity_date_to
        
    if campaign:
        where_clauses.append("EXISTS (SELECT 1 FROM actions act JOIN campaigns c ON act.campaign_id = c.id WHERE act.lead_id = l.id AND c.name ILIKE :camp)")
        params["camp"] = f"%{campaign}%"

    if status:
        if status.lower() == 'replied':
            where_clauses.append("EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id AND act.action_type = 'replied')")
        elif status.lower() == 'connected':
            where_clauses.append("EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id) AND NOT EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id AND act.action_type = 'replied')")
        elif status.lower() == 'new':
            where_clauses.append("NOT EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id)")
        else:
            where_clauses.append("EXISTS (SELECT 1 FROM actions act WHERE act.lead_id = l.id AND act.action_type = :status_val)")
            params["status_val"] = status.lower()
            
    where_sql = "WHERE " + " AND ".join(where_clauses)
    
    # Get total count of UNIQUE leads who replied with filters
    total_count_query = text(f"""
        SELECT count(DISTINCT a.lead_id) 
        FROM actions a
        JOIN leads l ON a.lead_id = l.id
        {where_sql}
    """)
    total_count = db.execute(total_count_query, params).scalar()
    
    # Get lead IDs and their first/last action dates for grouping and filtering
    lead_ids_query = text(f"""
        SELECT a.lead_id, 
               MAX(a.performed_at) as last_reply_at,
               (SELECT MIN(performed_at) FROM actions WHERE lead_id = a.lead_id) as first_action_at
        FROM actions a
        JOIN leads l ON a.lead_id = l.id
        {where_sql}
        GROUP BY a.lead_id
        ORDER BY last_reply_at DESC
        OFFSET :offset LIMIT :limit
    """)
    lead_ids_res = db.execute(lead_ids_query, params)
    lead_data_list = [row._mapping for row in lead_ids_res]
    
    if not lead_data_list:
        return {"leads": [], "total": 0, "page": page, "limit": limit}
        
    lead_ids = [row['lead_id'] for row in lead_data_list]
    
    # Fetch detailed info, ALL messages, and all campaigns/profiles for these leads
    detailed_query = text("""
        WITH lead_metadata AS (
            SELECT a.lead_id,
                   array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as campaign_names,
                   array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL) as profile_names
            FROM actions a
            LEFT JOIN campaigns c ON a.campaign_id = c.id
            LEFT JOIN profiles p ON a.profile_id = p.id
            WHERE a.lead_id IN :lead_ids
            GROUP BY a.lead_id
        )
        SELECT
            l.id as lead_id,
            coalesce(l.first_name, '') as first_name,
            coalesce(l.last_name, '') as last_name,
            coalesce(CASE WHEN l.work_email LIKE '%@%' THEN l.work_email ELSE '' END, '') as email,
            coalesce(l.linkedin_url, '') as linkedin_url,
            coalesce(l.photo_url, '') as photo_url,
            coalesce(l.current_employer, '') as company_name,
            coalesce(l.current_title, '') as title,
            coalesce(l.location, '') as location,
            m.campaign_names,
            m.profile_names,
            a.message,
            a.action_type,
            a.performed_at,
            p.name as profile_name
        FROM leads l
        JOIN actions a ON l.id = a.lead_id
        LEFT JOIN profiles p ON a.profile_id = p.id
        LEFT JOIN lead_metadata m ON l.id = m.lead_id
        WHERE l.id IN :lead_ids AND a.message <> ''
        ORDER BY a.performed_at ASC
    """)
    
    result = db.execute(detailed_query, {"lead_ids": tuple(lead_ids)})
    
    # Group by lead
    leads_dict = {}
    for row in result:
        r = row._mapping
        lid = r['lead_id']
        if lid not in leads_dict:
            last_reply = next(item['last_reply_at'] for item in lead_data_list if item['lead_id'] == lid)
            first_action = next(item['first_action_at'] for item in lead_data_list if item['lead_id'] == lid)
            leads_dict[lid] = {
                "id": lid,
                "first_name": r['first_name'],
                "last_name": r['last_name'],
                "email": r['email'],
                "linkedin_url": r['linkedin_url'],
                "photo_url": r['photo_url'],
                "company_name": r['company_name'],
                "title": r['title'],
                "location": r['location'],
                "status": "Engaged",
                "campaign_names": list(r['campaign_names']) if r['campaign_names'] else [],
                "profile_names": list(r['profile_names']) if r['profile_names'] else [],
                "last_reply_at": last_reply.isoformat() if last_reply else None,
                "created_at": first_action.isoformat() if first_action else None,
                "messages": []
            }
        
        leads_dict[lid]["messages"].append({
            "role": "lead" if r['action_type'] == 'replied' else "me",
            "text": r['message'],
            "profile_name": r['profile_name'] or 'Unknown',
            "timestamp": r['performed_at'].strftime('%H:%M %d.%m.%Y') if r['performed_at'] else ''
        })
    
    # Sort by last_reply_at descending
    final_leads = list(leads_dict.values())
    final_leads.sort(key=lambda x: x['last_reply_at'] or '', reverse=True)
    
    return {
        "leads": final_leads,
        "total": total_count,
        "page": page,
        "limit": limit
    }

def get_lead_activities(db: Session, lead_id: int):
    """Fetch all actions for a single lead, with campaign and profile info."""
    query = text("""
        SELECT
            a.id,
            a.action_type,
            a.message,
            a.performed_at,
            a.external_id,
            COALESCE(c.name, '') as campaign_name,
            COALESCE(p.name, '') as profile_name,
            p.id as profile_id
        FROM actions a
        LEFT JOIN campaigns c ON a.campaign_id = c.id
        LEFT JOIN profiles p ON a.profile_id = p.id
        WHERE a.lead_id = :lead_id
        ORDER BY a.performed_at ASC
    """)
    result = db.execute(query, {"lead_id": lead_id})
    activities = []
    for row in result:
        r = row._mapping
        activities.append({
            "id": r["id"],
            "type": r["action_type"],
            "message": r["message"] or "",
            "date": r["performed_at"].isoformat() if r["performed_at"] else None,
            "campaign": r["campaign_name"],
            "profile": r["profile_name"],
            "isLocal": str(r["external_id"]).startswith("manual_") if r["external_id"] else False
        })
    return {"activities": activities}

def add_lead_activity(db: Session, lead_id: int, activity_data):
    # Try exact match first
    campaign = db.query(Campaign).filter(Campaign.name == activity_data.campaign_name).first()
    
    if not campaign:
        # Try matching cleaned name
        res = db.execute(text("""
            SELECT id FROM campaigns 
            WHERE trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) = :name
            LIMIT 1
        """), {"name": activity_data.campaign_name})
        row = res.first()
        if row:
            campaign = db.query(Campaign).get(row[0])

    if not campaign:
        # Fallback to ilike match
        campaign = db.query(Campaign).filter(Campaign.name.ilike(f"%{activity_data.campaign_name}%")).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    profile = db.query(Profile).filter(Profile.name == activity_data.profile_name).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    dt = datetime.fromisoformat(activity_data.date.replace("Z", "+00:00"))

    new_action = Action(
        external_id=f"manual_{uuid.uuid4().hex}",
        action_type=activity_data.type,
        message=activity_data.message,
        performed_at=dt,
        lead_id=lead_id,
        campaign_id=campaign.id,
        profile_id=profile.id
    )
    db.add(new_action)
    db.commit()
    db.refresh(new_action)
    
    # --- ДОПОЛНИТЕЛЬНОЕ ЛОГИРОВАНИЕ В ФАЙЛ (ДЛЯ БЕЗОПАСНОСТИ) ---
    log_file = "manual_actions.log"
    # Получаем имя лида для лога
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    lead_name = f"{lead.first_name} {lead.last_name}" if lead else "Unknown"
    
    log_entry = (
        f"[{datetime.now().isoformat()}] LEAD_ID: {lead_id} | NAME: {lead_name} | TYPE: {activity_data.type} | "
        f"CAMPAIGN: {activity_data.campaign_name} | PROFILE: {activity_data.profile_name} | "
        f"MSG: {activity_data.message.replace('\n', ' ')}\n"
    )
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(log_entry)
    # -----------------------------------------------------------
    
    return {"status": "success", "id": new_action.id}

def add_lead_manual(db: Session, lead_data):
    """
    Создаёт лида вручную из CRM. Опционально привязывает его к кампании/профилю
    через служебное действие 'invited' с external_id вида manual_lead_<uuid>,
    чтобы лид появлялся в выборках по кампании/профилю.
    Дополнительно логирует событие в manual_leads.log.
    """
    # 1. Проверка на дубликат по LinkedIn / email
    existing = None
    if lead_data.linkedin_url:
        existing = db.query(Lead).filter(Lead.linkedin_url == lead_data.linkedin_url).first()
    if not existing and lead_data.email:
        existing = db.query(Lead).filter(
            (Lead.email == lead_data.email) | (Lead.work_email == lead_data.email)
        ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Lead already exists (id={existing.id}, name={existing.first_name} {existing.last_name})"
        )

    # 2. Создаём лида
    new_lead = Lead(
        external_id=f"manual_lead_{uuid.uuid4().hex}",
        first_name=lead_data.first_name or "",
        last_name=lead_data.last_name or "",
        email=lead_data.email or None,
        work_email=lead_data.email or None,
        linkedin_url=lead_data.linkedin_url or None,
        current_employer=lead_data.company or None,
        current_title=lead_data.title or None,
        location=lead_data.location or None,
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)

    # 3. Если указаны кампания и профиль, создаём служебное действие 'invited',
    # чтобы лид связался с ними и был виден в фильтрах
    linked_campaign = None
    linked_profile = None
    if lead_data.campaign_name and lead_data.profile_name:
        campaign = db.query(Campaign).filter(Campaign.name == lead_data.campaign_name).first()
        if not campaign:
            res = db.execute(text("""
                SELECT id FROM campaigns
                WHERE trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) = :name
                LIMIT 1
            """), {"name": lead_data.campaign_name})
            row = res.first()
            if row:
                campaign = db.query(Campaign).get(row[0])
        if not campaign:
            campaign = db.query(Campaign).filter(Campaign.name.ilike(f"%{lead_data.campaign_name}%")).first()

        profile = db.query(Profile).filter(Profile.name == lead_data.profile_name).first()

        if campaign and profile:
            new_action = Action(
                external_id=f"manual_lead_invite_{uuid.uuid4().hex}",
                action_type="invited",
                message="",
                performed_at=datetime.now(),
                lead_id=new_lead.id,
                campaign_id=campaign.id,
                profile_id=profile.id,
            )
            db.add(new_action)
            db.commit()
            linked_campaign = campaign.name
            linked_profile = profile.name

    # 4. Лог в файл (резервная копия)
    log_file = "manual_leads.log"
    full_name = f"{new_lead.first_name} {new_lead.last_name}".strip() or "Unknown"
    log_entry = (
        f"[{datetime.now().isoformat()}] LEAD_ID: {new_lead.id} | NAME: {full_name} | "
        f"EMAIL: {lead_data.email or ''} | LINKEDIN: {lead_data.linkedin_url or ''} | "
        f"COMPANY: {lead_data.company or ''} | TITLE: {lead_data.title or ''} | "
        f"LOCATION: {lead_data.location or ''} | "
        f"CAMPAIGN: {linked_campaign or ''} | PROFILE: {linked_profile or ''}\n"
    )
    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception as e:
        print(f"[manual_leads.log] write error: {e}")

    return {
        "status": "success",
        "id": new_lead.id,
        "linked_campaign": linked_campaign,
        "linked_profile": linked_profile,
    }


def remove_activity(db: Session, activity_id: int):
    action = db.query(Action).filter(Action.id == activity_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    db.delete(action)
    db.commit()
    
    return {"status": "success"}
