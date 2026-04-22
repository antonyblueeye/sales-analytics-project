from sqlalchemy.orm import Session
from sqlalchemy import and_, not_
from models import Action, Lead, MessageTemplate, MessageTemplateMap, Profile
from services.normalization_service import normalize_message
from difflib import SequenceMatcher
from collections import defaultdict

def get_similarity(a: str, b: str) -> float:
    # We use SequenceMatcher as it's better for text templates than raw cosine similarity
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def process_campaign_templates(db: Session):
    print("[TemplateService] Starting template processing...")
    
    # 1. Get profiles for signature stripping
    profiles = db.query(Profile).all()
    profile_names = [p.name for p in profiles]
    
    # 2. Find actions that are NOT yet mapped
    # We only care about 'invited' and 'message sent' for templates
    unmapped_actions = db.query(Action, Lead)\
        .join(Lead, Action.lead_id == Lead.id)\
        .outerjoin(MessageTemplateMap, Action.id == MessageTemplateMap.action_id)\
        .filter(MessageTemplateMap.id == None)\
        .filter(Action.action_type.in_(['invited', 'message sent']))\
        .order_by(Action.lead_id, Action.performed_at.asc())\
        .all()
    
    if not unmapped_actions:
        print("[TemplateService] No new actions to process.")
        return

    print(f"[TemplateService] Processing {len(unmapped_actions)} new actions.")

    # Group unmapped actions by lead to determine step_index
    lead_actions = defaultdict(list)
    for action, lead in unmapped_actions:
        lead_actions[lead.id].append((action, lead))

    processed_count = 0
    # Cache for cleaned campaign IDs to avoid redundant lookups
    campaign_group_cache = {}

    for lead_id, actions_list in lead_actions.items():
        # To determine the correct step_index, we need the FULL history of this lead
        full_history = db.query(Action)\
            .filter(Action.lead_id == lead_id)\
            .order_by(Action.performed_at.asc())\
            .all()
        
        for action, lead in actions_list:
            # 1. Normalize
            normalized = normalize_message(action.message, lead, profile_names)
            if not normalized and action.action_type == 'message sent':
                continue # Skip empty messages
            
            # 2. Determine campaign group IDs
            if action.campaign_id not in campaign_group_cache:
                from sqlalchemy import text
                # Get clean name of current campaign
                c_res = db.execute(text("SELECT name FROM campaigns WHERE id = :cid"), {"cid": action.campaign_id}).fetchone()
                if c_res:
                    import re
                    clean_name = re.sub(r'\s*(\[[^\]]*\]|\([^\)]*\))', '', c_res[0]).strip()
                    # Find all IDs for this clean name
                    ids_res = db.execute(text("""
                        SELECT id FROM campaigns 
                        WHERE trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) = :name
                    """), {"name": clean_name}).fetchall()
                    campaign_group_cache[action.campaign_id] = [r[0] for r in ids_res]
                else:
                    campaign_group_cache[action.campaign_id] = [action.campaign_id]

            group_ids = campaign_group_cache[action.campaign_id]

            # 3. Determine step_index (relative to full history)
            # Find this action's position in full history
            idx_in_history = -1
            for i, h_action in enumerate(full_history):
                if h_action.id == action.id:
                    idx_in_history = i
                    break
            
            if action.action_type == 'invited':
                step_index = 0
            else:
                # Count 'message sent' actions before this one in the full history
                prev_msgs = sum(1 for a in full_history[:idx_in_history] if a.action_type == 'message sent')
                step_index = prev_msgs + 1

            # 4. Check for reply
            # If the VERY NEXT action in full history is 'replied', then replied = True
            is_replied = False
            if idx_in_history != -1 and idx_in_history + 1 < len(full_history):
                if full_history[idx_in_history + 1].action_type == 'replied':
                    is_replied = True

            # 5. Find or Create Template in the entire Group
            existing_templates = db.query(MessageTemplate)\
                .filter(MessageTemplate.campaign_id.in_(group_ids))\
                .filter(MessageTemplate.step_index == step_index)\
                .all()
            
            found_template = None
            for t in existing_templates:
                if get_similarity(normalized, t.template) >= 0.8:
                    found_template = t
                    break
            
            if not found_template:
                found_template = MessageTemplate(
                    template=normalized,
                    campaign_id=action.campaign_id,
                    step_index=step_index
                )
                db.add(found_template)
                db.flush() # Get ID

            # 6. Map Action to Template
            mapping = MessageTemplateMap(
                action_id=action.id,
                message_template_id=found_template.id,
                replied=is_replied
            )
            db.add(mapping)
            processed_count += 1
            
            # Commit in chunks to avoid large transactions
            if processed_count % 100 == 0:
                db.commit()

    db.commit()
    print(f"[TemplateService] Finished. Processed {processed_count} actions.")
    return processed_count
