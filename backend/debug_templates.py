from database import SessionLocal
from sqlalchemy import text, func
from models import MessageTemplate, MessageTemplateMap, Campaign
import re

def debug_campaign(campaign_name):
    db = SessionLocal()
    print(f"Debugging campaign: '{campaign_name}'")
    
    # 1. Clean name
    clean_name = re.sub(r'\s*(\[[^\]]*\]|\([^\)]*\))', '', campaign_name).strip()
    print(f"Cleaned name: '{clean_name}'")
    
    # 2. Find IDs
    res = db.execute(text("""
        SELECT id, name FROM campaigns 
        WHERE trim(regexp_replace(name, '\\s*(\\[[^\\]]*\\]|\\([^\\)]*\\))', '', 'g')) = :name
    """), {"name": clean_name})
    campaign_info = [(row[0], row[1]) for row in res]
    campaign_ids = [c[0] for c in campaign_info]
    print(f"Found IDs: {campaign_ids}")
    for cid, cname in campaign_info:
        print(f"  - ID {cid}: '{cname}'")

    if not campaign_ids:
        print("NO CAMPAIGN IDS FOUND!")
        return

    # 3. Check templates
    t_count = db.query(MessageTemplate).filter(MessageTemplate.campaign_id.in_(campaign_ids)).count()
    print(f"Templates for these IDs: {t_count}")
    
    if t_count > 0:
        # Check mappings
        m_count = db.query(MessageTemplateMap)\
            .join(MessageTemplate, MessageTemplateMap.message_template_id == MessageTemplate.id)\
            .filter(MessageTemplate.campaign_id.in_(campaign_ids)).count()
        print(f"Mappings for these IDs: {m_count}")
        
        # Check those with > 10 sends
        high_vol = db.query(MessageTemplate.id)\
            .join(MessageTemplateMap, MessageTemplate.id == MessageTemplateMap.message_template_id)\
            .filter(MessageTemplate.campaign_id.in_(campaign_ids))\
            .group_by(MessageTemplate.id)\
            .having(func.count(MessageTemplateMap.id) > 10).count()
        print(f"Templates with > 10 sends: {high_vol}")

    db.close()

if __name__ == "__main__":
    # Test with a known campaign name if possible, or common one
    # I'll just check what campaigns we have first
    db = SessionLocal()
    c = db.query(Campaign).first()
    if c:
        debug_campaign(c.name)
    else:
        print("No campaigns in DB")
    db.close()
