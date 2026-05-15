from database import SessionLocal
from models import Action, Lead, Campaign, Profile
from datetime import datetime
import uuid

def final_recovery():
    db = SessionLocal()
    p = db.query(Profile).filter(Profile.name == 'Volodymyr Paslavskyy').first()
    c = db.query(Campaign).filter(Campaign.name.ilike('%Fractional CTO%')).first()
    
    # We look for Jennifer and Chet specifically in that campaign
    leads = db.query(Lead).join(Action).filter(
        Lead.first_name.in_(['Jennifer', 'Chet']),
        Action.campaign_id == c.id
    ).distinct().all()
    
    for l in leads:
        # Check if already exists to avoid duplicates
        exists = db.query(Action).filter(
            Action.lead_id == l.id,
            Action.action_type == 'interested',
            Action.performed_at == datetime(2026, 5, 13, 17, 40)
        ).first()
        
        if not exists:
            db.add(Action(
                external_id=f'manual_recovery_{uuid.uuid4().hex}',
                action_type='interested',
                message='',
                performed_at=datetime(2026, 5, 13, 17, 40),
                lead_id=l.id,
                campaign_id=c.id,
                profile_id=p.id
            ))
            print(f"Restored 'interested' for {l.first_name} {l.last_name}")
    
    db.commit()
    db.close()

if __name__ == "__main__":
    final_recovery()
