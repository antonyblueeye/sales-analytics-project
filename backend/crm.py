import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Action, Lead
from sqlalchemy import and_
from datetime import datetime, date

def get_leads_list(
    db: Session, 
    page: int = 1, 
    limit: int = 20, 
    search: str = None,
    first_name: str = None,
    last_name: str = None,
    company: str = None,
    location: str = None,
    title: str = None,
    create_date_from: str = None,
    create_date_to: str = None,
    activity_date_from: str = None,
    activity_date_to: str = None
):
    offset = (page - 1) * limit
    
    where_clauses = []
    params = {"offset": offset, "limit": limit}
    
    if search:
        where_clauses.append("(first_name ILIKE :search OR last_name ILIKE :search OR (first_name || ' ' || last_name) ILIKE :search OR current_employer ILIKE :search)")
        params["search"] = f"%{search}%"
    
    if first_name:
        where_clauses.append("first_name ILIKE :fn")
        params["fn"] = f"%{first_name}%"
    if last_name:
        where_clauses.append("last_name ILIKE :ln")
        params["ln"] = f"%{last_name}%"
    if company:
        where_clauses.append("current_employer ILIKE :comp")
        params["comp"] = f"%{company}%"
    if location:
        where_clauses.append("location ILIKE :loc")
        params["loc"] = f"%{location}%"
    if title:
        where_clauses.append("current_title ILIKE :ttl")
        params["ttl"] = f"%{title}%"

    if create_date_from:
        where_clauses.append("created_at >= :c_from")
        params["c_from"] = create_date_from
    if create_date_to:
        where_clauses.append("created_at <= :c_to")
        params["c_to"] = create_date_to
        
    if activity_date_from:
        # For general leads, activity_date might mean 'any action performed at'
        # This requires a JOIN or a subquery. For now, let's just filter leads by their creation date
        # if we don't want to join actions for the entire 'All leads' list yet.
        # But if accuracy is needed:
        where_clauses.append("EXISTS (SELECT 1 FROM actions a WHERE a.lead_id = leads.id AND a.performed_at >= :a_from)")
        params["a_from"] = activity_date_from
    if activity_date_to:
        where_clauses.append("EXISTS (SELECT 1 FROM actions a WHERE a.lead_id = leads.id AND a.performed_at <= :a_to)")
        params["a_to"] = activity_date_to
        
    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)
        
    # Get total count with filters
    count_query = text(f"SELECT count(*) FROM leads {where_sql}")
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
                   CASE WHEN COUNT(CASE WHEN a.action_type = 'replied' THEN 1 END) > 0 THEN 'Replied'
                        WHEN COUNT(*) > 0 THEN 'Connected'
                        ELSE 'New' END as status,
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
    search: str = None,
    first_name: str = None,
    last_name: str = None,
    company: str = None,
    location: str = None,
    title: str = None,
    create_date_from: str = None,
    create_date_to: str = None,
    activity_date_from: str = None,
    activity_date_to: str = None
):
    offset = (page - 1) * limit
    
    where_clauses = ["a.action_type = 'replied'"]
    params = {"offset": offset, "limit": limit}
    
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
        where_clauses.append("l.created_at >= :c_from")
        params["c_from"] = create_date_from
    if create_date_to:
        where_clauses.append("l.created_at <= :c_to")
        params["c_to"] = create_date_to
        
    if activity_date_from:
        # activity_date logic for Replied leads might need adjustment but 
        # let's assume it means 'last reply performed at' or similar
        where_clauses.append("a.performed_at >= :a_from")
        params["a_from"] = activity_date_from
    if activity_date_to:
        where_clauses.append("a.performed_at <= :a_to")
        params["a_to"] = activity_date_to
        
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
                "status": "Replied",
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
        })
    return {"activities": activities}
