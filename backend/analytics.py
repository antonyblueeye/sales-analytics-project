import sys
import os
# Добавляем текущую директорию в путь поиска модулей, чтобы импорты из этого же фолдера работали корректно
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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


def get_campaigns_summary(db: Session, from_date: date, to_date: date):
    """
    Возвращает сводку по кампейнам: инвайты, принятые, сообщения, ответы и проценты.
    Фильтрует действия по диапазону дат (performed_at).
    """
    # Сдвигаем конечную дату на +1 день, чтобы поиск захватил весь последний день (до 23:59:59)
    # так как performed_at содержит время.
    from datetime import timedelta
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
    # Превращаем результат в список словарей для удобства фронта
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
    """
    Returns a unique list of campaign names after cleaning (removing [Tags] etc.)
    """
    sql = text("""
        SELECT DISTINCT trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) AS clean_campaign
        FROM campaigns
        WHERE name IS NOT NULL
        ORDER BY clean_campaign
    """)
    result = db.execute(sql)
    return [row.clean_campaign for row in result if row.clean_campaign]

def get_campaign_history(db: Session, campaign_name: str, granularity: str):
    """
    Returns historical data for a specific campaign aggregated by day, week, or month.
    """
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
    """
    Returns daily aggregates of actions (invites, accepts, messages, replies) across the dataset.
    """
    from datetime import timedelta
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
    """
    Returns a list of recent replies with lead info (name, photo, message text).
    """
    from datetime import timedelta
    import re
    from models import Campaign, Profile, Action, Lead
    next_day = to_date + timedelta(days=1)
    
    from sqlalchemy import func
    # Запрос через ORM: берем Action как основу и цепляем связанные таблицы
    results = db.query(Action, Lead, Campaign, Profile)\
        .join(Lead, Action.lead_id == Lead.id)\
        .outerjoin(Campaign, Action.campaign_id == Campaign.id)\
        .outerjoin(Profile, Action.profile_id == Profile.id)\
        .filter(Action.action_type == 'replied')\
        .filter(func.date(Action.performed_at) >= from_date)\
        .filter(func.date(Action.performed_at) <= to_date)\
        .order_by(Action.performed_at.desc())\
        .limit(200).all()\
    
    def clean_name(name):
        if not name: return "N/A"
        # Убираем любые скобки [квадратные] и (круглые) и текст внутри них
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
    Dynamically reconstructs the campaign message sequence by analyzing past actions.
    Normalizes messages into templates and identifies versions based on first appearance.
    """
    import re
    from collections import defaultdict
    from models import Action, Lead, Campaign

    # 1. Get all relevant campaign IDs that share this cleaned name
    res = db.execute(text("""
        SELECT id FROM campaigns 
        WHERE trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) = :name
    """), {"name": campaign_name})
    campaign_ids = [row[0] for row in res]
    
    if not campaign_ids:
        return []

    # Get profile names for signature stripping
    profile_names = [row[0].split()[0] for row in db.execute(text("SELECT name FROM profiles")).all()]
    profile_names.extend(['Nazar', 'Volodymyr', 'Svitlana']) # Explicitly add as requested
    profile_names = list(set([n for n in profile_names if n]))

    # 2. Get actions with lead info
    actions = db.query(Action, Lead)\
        .join(Lead, Action.lead_id == Lead.id)\
        .filter(Action.campaign_id.in_(campaign_ids))\
        .filter(Action.action_type.in_(['invited', 'message sent']))\
        .order_by(Action.lead_id, Action.performed_at.asc())\
        .all()

    def normalize_company(company):
        if not company: return ""
        suffixes = r'\s+(Inc\.?|Ltd\.?|LLC|Corp\.?|Corporation|GmbH|S\.A\.?|PLC|S\.R\.L\.?|Holdings|Group)$'
        clean = re.sub(suffixes, '', company, flags=re.I).strip()
        clean = re.sub(r'\s*[\(\[].*?[\)\]]', '', clean).strip()
        return clean

    def normalize_name(first, last, handle, url):
        variants = []
        def extract_from_string(s):
            if not s: return []
            if '/' in s: s = s.split('/')[-1]
            # Split by common delimiters and also keep the whole string (with spaces instead of delimiters)
            cleaned = re.sub(r'[-_\.]', ' ', s).strip()
            parts = cleaned.split()
            res = [cleaned] + [p for p in parts if len(p) > 2]
            return [r for r in res if r and len(r) > 1]

        if first:
            f_clean = re.sub(r'\s*[\(\[].*?[\)\]]', '', first).strip()
            variants.append(first)
            variants.append(f_clean)
            if ' ' in f_clean: variants.append(f_clean.split()[0])
        if last:
            l_clean = re.sub(r'\s*[\(\[].*?[\)\]]', '', last).strip()
            variants.append(last)
            variants.append(l_clean)
        
        if handle: variants.extend(extract_from_string(handle))
        if url: variants.extend(extract_from_string(url))

        if first and last:
            f_c = re.sub(r'\s*[\(\[].*?[\)\]]', '', first).strip()
            l_c = re.sub(r'\s*[\(\[].*?[\)\]]', '', last).strip()
            variants.append(f"{f_c} {l_c}")
            variants.append(f"{f_c} {l_c[0]}.")
        return sorted(list(set([v for v in variants if v and len(v) > 1])), key=len, reverse=True)

    def strip_signature(text, names):
        closings = r'(Best regards|Regards|Best|Sincerely|Kind regards|Cheers|Thanks|Thank you|Best wishes|All the best|Warmly|Warm regards)'
        # Remove common signature patterns at the end of the text
        lines = text.strip().split('\n')
        if len(lines) < 2: return text
        
        # Check if last line looks like a name or initial
        last_line = lines[-1].strip().strip(',.!')
        is_name = any(last_line.lower() == n.lower() for n in names) or (len(last_line) <= 2 and last_line.isupper())
        
        # Check if penultimate line is a closing
        penultimate = lines[-2].strip().strip(',.!')
        is_closing = re.match(rf'^{closings}$', penultimate, re.I)
        
        if is_name and is_closing:
            return '\n'.join(lines[:-2]).strip()
        if is_name and len(lines) > 2 and not lines[-2].strip():
            # If name is separated by empty line from body, and it's a known name
            return '\n'.join(lines[:-1]).strip()
        return text

    # 3. Group by lead
    lead_sequences = defaultdict(list)
    for action, lead in actions:
        lead_sequences[lead.id].append((action, lead))

    # Using a list of versions per step for fuzzy matching
    from difflib import SequenceMatcher
    # steps_data[step_idx] = [ {text, first_seen, last_seen, type} ]
    steps_data = defaultdict(list)

    for lead_id, seq in lead_sequences.items():
        msg_step_count = 0
        for i, (action, lead) in enumerate(seq):
            if i == 0 and action.action_type == 'invited':
                current_step_idx = 0
            elif action.action_type == 'message sent':
                if seq[0][0].action_type == 'invited':
                    msg_step_count += 1
                    current_step_idx = msg_step_count
                else:
                    current_step_idx = msg_step_count
                    msg_step_count += 1
            else:
                continue

            msg = action.message or ""
            if not msg: continue

            # Template Normalization (Name & Company only)
            normalized = msg
            name_variants = normalize_name(lead.first_name, lead.last_name, lead.linkedin_handle, lead.linkedin_url)
            
            # Aggressive fallback: find [Greeting] [Name] OR just [Name] followed by punctuation/smile at the very start
            # Pattern 1: Standard Greeting + Name
            m_fb = re.search(r'\b(Hi|Hello|Hey|Greetings|Dear)\s+([A-Z][^?!:,\n]{1,25})\b', normalized, flags=re.I)
            if m_fb and m_fb.start() < 25:
                name_variants.append(m_fb.group(2).strip())
            
            # Pattern 2: [Name] followed by symbols like ?:), !:) at the start
            m_fb_short = re.search(r'^([^?!:,\n]{1,20})\s*[?!:]{1,3}\s*[:;][\(\)DP]', normalized)
            if m_fb_short:
                name_variants.append(m_fb_short.group(1).strip())

            for var in name_variants:
                p_greet = r'Hi|Hello|Hey|Greetings|Dear'
                p_title = r'Dr\.?|Mr\.?|Ms\.?|Mrs\.?|Prof\.?'
                # Pattern: optional greeting/title, then the detected name
                pattern = rf'({p_greet})?\s*({p_title})?\s*\b{re.escape(var)}(\s*[\(\[].*?[\)\]])*(\s+[A-Z]\.?)*'
                match = re.search(pattern, normalized, flags=re.I)
                if match and match.start() < 30:
                    start, end = match.span()
                    punctuation = ""
                    if end < len(normalized) and normalized[end] in ',!?.':
                        punctuation = normalized[end]
                        end += 1
                    g, t = match.group(1) or "", match.group(2) or ""
                    # Force "Hi" normalization
                    res = f"Hi {t} {{{{firstName}}}}{punctuation}" if g else f"{t} {{{{firstName}}}}{punctuation}"
                    res = re.sub(r'\s+', ' ', res).strip()
                    normalized = normalized[:start] + res + normalized[end:]
                    break 

            if lead.current_employer:
                cleaned_company = normalize_company(lead.current_employer)
                comp_variants = sorted(list(set([lead.current_employer, cleaned_company])), key=len, reverse=True)
                for var in comp_variants:
                    if not var or len(var) < 3: continue
                    normalized = re.sub(rf'{re.escape(var)}(\s*[\(\[].*?[\)\]])?', '{{companyName}}', normalized, flags=re.I)

            # Strip Signature
            normalized = strip_signature(normalized, profile_names)

            # Create a comparison key for fuzzy matching (strip emojis, leading typos, and normalize whitespace)
            comp_key = re.sub(r'[^\x00-\x7F]+', '', normalized) # Remove emojis
            comp_key = re.sub(r'^[\s/ \-\._]+', '', comp_key) # Remove leading typos (like /)
            comp_key = re.sub(r'\s+', ' ', comp_key).strip().lower() # Normalize whitespace/case

            # FUZZY MATCHING: check if this matches any existing version in this step
            found_version = None
            for v in steps_data[current_step_idx]:
                # Build comparison key for existing version
                v_comp = re.sub(r'[^\x00-\x7F]+', '', v['text'])
                v_comp = re.sub(r'^[\s/ \-\._]+', '', v_comp)
                v_comp = re.sub(r'\s+', ' ', v_comp).strip().lower()
                
                # Similarity check (85%)
                if SequenceMatcher(None, comp_key, v_comp).ratio() > 0.85:
                    found_version = v
                    break
            
            if found_version:
                if action.performed_at < found_version['first_seen']:
                    found_version['first_seen'] = action.performed_at
                if action.performed_at > found_version['last_seen']:
                    found_version['last_seen'] = action.performed_at
                    # Keep the original "normalized" (with newlines/emojis) as the display text
                    found_version['text'] = normalized
            else:
                steps_data[current_step_idx].append({
                    'text': normalized,
                    'first_seen': action.performed_at,
                    'last_seen': action.performed_at,
                    'type': action.action_type
                })

    # 4. Format for frontend
    result = []
    has_invitation = 0 in steps_data and any(v['type'] == 'invited' for v in steps_data[0])
    
    for idx in sorted(steps_data.keys()):
        # Sort versions by last_seen DESC (latest versions first)
        versions_list = sorted(steps_data[idx], key=lambda x: x['last_seen'], reverse=True)
        if not versions_list: continue

        primary_type = versions_list[0]['type']
        if primary_type == 'invited': 
            title = "Invitation"
        else: 
            title = f"Message #{idx if has_invitation else idx + 1}"

        formatted_versions = [
            {"text": v['text'], "date": v['first_seen'].strftime("%d.%m.%Y")} 
            for v in versions_list
        ]
        
        result.append({
            "id": idx,
            "title": title,
            "description": "Connection request step." if primary_type == 'invited' else f"Sequential follow-up message.",
            "versions": formatted_versions
        })

    return result
