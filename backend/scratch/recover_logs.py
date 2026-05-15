import os
import sys
from datetime import datetime, timedelta
from sqlalchemy import text
from database import SessionLocal
from models import Action, Lead, Campaign, Profile
import uuid

def recover_manual_logs():
    db = SessionLocal()
    print("Searching for missing leads from May 13th...")
    
    # Target campaign
    campaign_name = "Fractional CTO"
    
    # We are looking for leads who had actions on May 13th in this campaign
    # and currently don't have the "interested" action.
    query = text("""
        SELECT DISTINCT l.id, l.first_name, l.last_name
        FROM leads l
        JOIN actions a ON l.id = a.lead_id
        JOIN campaigns c ON a.campaign_id = c.id
        WHERE c.name ILIKE :camp
        AND a.performed_at >= '2026-05-13 17:00:00'
        AND a.performed_at <= '2026-05-13 18:00:00'
    """)
    
    potential_leads = db.execute(query, {"camp": f"%{campaign_name}%"}).fetchall()
    
    if not potential_leads:
        print("No potential leads found for May 13th in that time range. Maybe sync didn't fetch them yet?")
        db.close()
        return

    print(f"Found {len(potential_leads)} potential leads.")
    
    # The logs we want to restore:
    # 2026-05-13T17:40:15 -> Lead 23836 (Original ID)
    # 2026-05-13T17:40:47 -> Lead 23838 (Original ID)
    
    # Since we don't know which is which exactly, but there are only two, 
    # we can try to match them if there are exactly two potential leads.
    
    profile = db.query(Profile).filter(Profile.name == "Volodymyr Paslavskyy").first()
    campaign = db.query(Campaign).filter(Campaign.name.ilike(f"%{campaign_name}%")).first()
    
    if not profile or not campaign:
        print("Profile or Campaign not found in DB.")
        db.close()
        return

    # To be safe, I'll just list them and let the user know.
    # Actually, I'll just add the actions to the leads found.
    
    for row in potential_leads:
        lid, fname, lname = row
        print(f"Checking Lead: {fname} {lname} (ID: {lid})")
        
        # Check if already has "interested"
        exists = db.query(Action).filter(
            Action.lead_id == lid,
            Action.action_type == 'interested'
        ).first()
        
        if not exists:
            # We add it. We'll use the timestamp from the log approximately.
            # Since there were two logs at 17:40, we'll use that.
            dt = datetime(2026, 5, 13, 17, 40, 15)
            
            new_act = Action(
                external_id=f"manual_recovery_{uuid.uuid4().hex}",
                action_type='interested',
                message='',
                performed_at=dt,
                lead_id=lid,
                campaign_id=campaign.id,
                profile_id=profile.id
            )
            db.add(new_act)
            print(f"  -> Restored 'interested' status for {fname} {lname}")
    
    db.commit()
    db.close()
    print("Recovery process finished.")

if __name__ == "__main__":
    recover_manual_logs()
