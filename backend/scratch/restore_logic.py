import os
import sys
import io
import re
from datetime import datetime
from database import SessionLocal
from models import Action, Lead, Campaign, Profile
import uuid

# Fix encoding
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def restore_from_log():
    db = SessionLocal()
    log_file = "manual_actions.log"
    
    if not os.path.exists(log_file):
        print("Log file not found.")
        return

    print(f"Reading {log_file}...")
    with open(log_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    restored = 0
    for line in lines:
        # Format: [2026-05-13T17:40:47.445494] LEAD_ID: 23838 | TYPE: interested | CAMPAIGN: Fractional CTO | PROFILE: Volodymyr Paslavskyy | MSG: 
        # Or newer format with NAME: ...
        match = re.search(r'\[(.*?)\] LEAD_ID: (\d+)', line)
        if not match: continue
        
        timestamp_str = match.group(1)
        old_lead_id = int(match.group(2))
        
        # Extract fields
        action_type = re.search(r'TYPE: (.*?) \|', line).group(1).strip()
        campaign_name = re.search(r'CAMPAIGN: (.*?) \|', line).group(1).strip()
        profile_name = re.search(r'PROFILE: (.*?) \|', line).group(1).strip()
        msg_match = re.search(r'MSG: (.*)$', line)
        message = msg_match.group(1).strip() if msg_match else ""

        performed_at = datetime.fromisoformat(timestamp_str)
        
        # Now, we need to find the lead. 
        # Since the ID might have changed, we try to find the lead by looking for 
        # an action they performed at the same time (sync actions usually match timestamps)
        # or we try to find the lead in the campaign.
        
        # But wait, if we have the NAME in newer logs, use it.
        name_match = re.search(r'NAME: (.*?) \|', line)
        lead_name = name_match.group(1).strip() if name_match else None
        
        target_lead_id = None
        
        if lead_name:
            fname, *lname_parts = lead_name.split(' ')
            lname = ' '.join(lname_parts)
            lead = db.query(Lead).filter(Lead.first_name == fname, Lead.last_name == lname).first()
            if lead:
                target_lead_id = lead.id
        
        if not target_lead_id:
            # Try to find by activity around that time in that campaign
            # Search for ANY action within 2 hours of the manual action for that campaign
            query = db.query(Lead).join(Action).join(Campaign).filter(
                Campaign.name.ilike(f"%{campaign_name}%"),
                Action.performed_at >= performed_at - timedelta(hours=2),
                Action.performed_at <= performed_at + timedelta(hours=2)
            ).first() # This is a guess, but it might work
            # Actually, the user's manual action ID was unique at the time.
            # Let's just try to find a lead that currently has the same campaigns/profiles?
            pass

        # IF we can't find it, we might have to skip or ask.
        # But for the May 13th ones, we have the IDs.
        # Wait, if I can't find the lead, I can't restore.
        
        # For now, let's just try to restore the ones where we can find the lead.
        if target_lead_id:
            # ... restore logic ...
            pass
            
    print("Done.")

restore_from_log()
