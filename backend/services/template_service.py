from sqlalchemy.orm import Session
from sqlalchemy import and_, not_, text
from models import Action, Lead, MessageTemplate, MessageTemplateMap, Profile
from services.normalization_service import normalize_message
from difflib import SequenceMatcher
from collections import defaultdict

def get_similarity(a: str, b: str) -> float:
    # We use SequenceMatcher as it's better for text templates than raw cosine similarity
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def process_campaign_templates(db: Session, prioritize_campaign_name: str = None):
    print(f"[TemplateService] Starting template processing... (Prioritize: {prioritize_campaign_name})")
    
    # 1. Get profiles for signature stripping
    profiles = db.query(Profile).all()
    profile_names = [p.name for p in profiles]
    
    # 2. Find actions that are NOT yet mapped
    query = db.query(Action, Lead)\
        .join(Lead, Action.lead_id == Lead.id)\
        .outerjoin(MessageTemplateMap, Action.id == MessageTemplateMap.action_id)\
        .filter(MessageTemplateMap.id == None)\
        .filter(Action.action_type.in_(['invited', 'message sent']))

    unmapped_actions = query.order_by(Action.lead_id, Action.performed_at.asc()).all()
    
    if not unmapped_actions:
        print("[TemplateService] No new actions to process.")
        return 0

    if prioritize_campaign_name:
        priority_ids = []
        res = db.execute(text("""
            SELECT id FROM campaigns 
            WHERE trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) = :name
        """), {"name": prioritize_campaign_name})
        priority_ids = [row[0] for row in res]
        
        if priority_ids:
            prioritized = [a for a in unmapped_actions if a[0].campaign_id in priority_ids]
            others = [a for a in unmapped_actions if a[0].campaign_id not in priority_ids]
            unmapped_actions = prioritized + others
            print(f"[TemplateService] Prioritized {len(prioritized)} actions.")

    print(f"[TemplateService] Processing {len(unmapped_actions)} new actions.")

    lead_unmapped = defaultdict(list)
    lead_order = []
    for action, lead in unmapped_actions:
        if lead.id not in lead_unmapped:
            lead_order.append(lead.id)
        lead_unmapped[lead.id].append((action, lead))

    processed_count = 0
    CHUNKS_OF_LEADS = 200
    
    campaign_group_cache = {}
    template_cache = {} 

    for i in range(0, len(lead_order), CHUNKS_OF_LEADS):
        chunk_lead_ids = lead_order[i:i + CHUNKS_OF_LEADS]
        
        full_histories = db.query(Action)\
            .filter(Action.lead_id.in_(chunk_lead_ids))\
            .order_by(Action.lead_id, Action.performed_at.asc())\
            .all()
        
        history_by_lead = defaultdict(list)
        for h_action in full_histories:
            history_by_lead[h_action.lead_id].append(h_action)

        for lead_id in chunk_lead_ids:
            actions_list = lead_unmapped[lead_id]
            full_history = history_by_lead[lead_id]
            
            for action, lead in actions_list:
                normalized = normalize_message(action.message, lead, profile_names)
                if not normalized and action.action_type == 'message sent':
                    continue
                
                if action.campaign_id not in campaign_group_cache:
                    c_res = db.execute(text("SELECT name FROM campaigns WHERE id = :cid"), {"cid": action.campaign_id}).fetchone()
                    if c_res:
                        import re
                        clean_name = re.sub(r'\s*(\[[^\]]*\]|\([^\)]*\))', '', c_res[0]).strip()
                        ids_res = db.execute(text("""
                            SELECT id FROM campaigns 
                            WHERE trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) = :name
                        """), {"name": clean_name}).fetchall()
                        campaign_group_cache[action.campaign_id] = tuple(sorted([r[0] for r in ids_res]))
                    else:
                        campaign_group_cache[action.campaign_id] = (action.campaign_id,)

                group_ids = campaign_group_cache[action.campaign_id]

                idx_in_history = -1
                for idx, h_action in enumerate(full_history):
                    if h_action.id == action.id:
                        idx_in_history = idx
                        break
                
                if action.action_type == 'invited':
                    step_index = 0
                else:
                    prev_msgs = sum(1 for a in full_history[:idx_in_history] if a.action_type == 'message sent')
                    step_index = prev_msgs + 1

                is_replied = False
                is_accepted = False
                if idx_in_history != -1:
                    # Look ahead for 'replied' or 'accepted'
                    for next_action in full_history[idx_in_history + 1:]:
                        if next_action.action_type == 'replied':
                            is_replied = True
                        if next_action.action_type == 'accepted':
                            is_accepted = True
                        # If we see another 'message sent' or 'invited', stop looking? 
                        # Actually, we want to know if THIS invite ever got accepted.
                        # Usually, acceptance comes before the next message.
                        if next_action.action_type in ['invited', 'message sent']:
                            break

                # 5. Find or Create Template (Search across ALL steps in the group)
                cache_key = group_ids
                if cache_key not in template_cache:
                    template_cache[cache_key] = db.query(MessageTemplate)\
                        .filter(MessageTemplate.campaign_id.in_(group_ids))\
                        .all()
                
                found_template = None
                # First try exact match (very fast)
                for t in template_cache[cache_key]:
                    if normalized == t.template:
                        found_template = t
                        break
                
                # Then try fuzzy match (0.8 similarity)
                if not found_template:
                    for t in template_cache[cache_key]:
                        if get_similarity(normalized, t.template) >= 0.8:
                            found_template = t
                            break
                
                if not found_template:
                    found_template = MessageTemplate(
                        template=normalized,
                        campaign_id=action.campaign_id,
                        step_index=step_index # Store the step where we first found it
                    )
                    db.add(found_template)
                    db.flush()
                    template_cache[cache_key].append(found_template)

                # 6. Map Action
                mapping = MessageTemplateMap(
                    action_id=action.id,
                    message_template_id=found_template.id,
                    replied=is_replied,
                    accepted=is_accepted
                )
                db.add(mapping)
                processed_count += 1
                
                if processed_count % 100 == 0:
                    db.commit()
                    print(f"[TemplateService] Processed {processed_count} actions...")

    db.commit()
    print(f"[TemplateService] Finished. Processed {processed_count} actions.")
    return processed_count
