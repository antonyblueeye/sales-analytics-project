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
    title: str = None
):
    offset = (page - 1) * limit
    
    where_clauses = []
    params = {"offset": offset, "limit": limit}
    
    if search:
        where_clauses.append("(first_name ILIKE :search OR last_name ILIKE :search OR current_employer ILIKE :search)")
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
            COALESCE(st.status, 'New') as status
        FROM leads l
        LEFT JOIN (
            SELECT lead_id, 
                   CASE WHEN COUNT(CASE WHEN action_type = 'replied' THEN 1 END) > 0 THEN 'Replied'
                        WHEN COUNT(*) > 0 THEN 'Connected'
                        ELSE 'New' END as status
            FROM actions
            GROUP BY lead_id
        ) st ON l.id = st.lead_id
        {where_sql}
        ORDER BY l.id
        OFFSET :offset LIMIT :limit
    """)
    
    result = db.execute(query, params)
    leads_list = [dict(row._mapping) for row in result]
    
    if not leads_list:
        return {"leads": [], "total": 0, "page": page, "limit": limit}

    lead_ids = [l['id'] for l in leads_list]
    
    # FETCH MESSAGES for these leads to populate the Correspondence drawer
    msg_query = text("""
        SELECT lead_id, message, action_type, performed_at
        FROM actions
        WHERE lead_id IN :lead_ids AND message <> ''
        ORDER BY performed_at ASC
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
            "timestamp": r['performed_at'].strftime('%H:%M %d.%m.%Y') if r['performed_at'] else ''
        })

    # Attach messages to lead objects
    for lead in leads_list:
        lead['messages'] = messages_by_lead.get(lead['id'], [])
    
    return {
        "leads": leads_list,
        "total": total_count,
        "page": page,
        "limit": limit
    }

def get_replied_leads(db: Session, page: int = 1, limit: int = 20):
    offset = (page - 1) * limit
    
    # Get total count of UNIQUE leads who replied
    total_count_query = text("""
        SELECT count(DISTINCT lead_id) 
        FROM actions 
        WHERE action_type = 'replied'
    """)
    total_count = db.execute(total_count_query).scalar()
    
    # Get lead IDs for the current page, sorted by latest reply
    lead_ids_query = text("""
        SELECT lead_id, MAX(performed_at) as last_reply_at
        FROM actions
        WHERE action_type = 'replied'
        GROUP BY lead_id
        ORDER BY last_reply_at DESC
        OFFSET :offset LIMIT :limit
    """)
    lead_ids_res = db.execute(lead_ids_query, {"offset": offset, "limit": limit})
    lead_data_list = [row._mapping for row in lead_ids_res]
    
    if not lead_data_list:
        return {"leads": [], "total": 0, "page": page, "limit": limit}
        
    lead_ids = [row['lead_id'] for row in lead_data_list]
    
    # Fetch detailed info and ALL messages for these leads
    detailed_query = text("""
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
            a.message,
            a.action_type,
            a.performed_at
        FROM leads l
        JOIN actions a ON l.id = a.lead_id
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
                "last_reply_at": last_reply.isoformat() if last_reply else None,
                "messages": []
            }
        
        leads_dict[lid]["messages"].append({
            "role": "lead" if r['action_type'] == 'replied' else "me",
            "text": r['message'],
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
