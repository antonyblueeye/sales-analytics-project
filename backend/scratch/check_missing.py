from database import SessionLocal
from models import Action, Lead
from datetime import datetime

def check_missing_logs():
    db = SessionLocal()
    target_ids = [23836, 23838]
    print(f"Checking Leads: {target_ids}")
    for lid in target_ids:
        lead = db.query(Lead).filter(Lead.id == lid).first()
        if lead:
            print(f"Lead {lid} FOUND: {lead.first_name} {lead.last_name}")
            actions = db.query(Action).filter(Action.lead_id == lid).all()
            print(f"  Actions found: {len(actions)}")
            for a in actions:
                print(f"    - {a.action_type} at {a.performed_at}")
        else:
            print(f"Lead {lid} NOT FOUND")
    db.close()

if __name__ == "__main__":
    check_missing_logs()
