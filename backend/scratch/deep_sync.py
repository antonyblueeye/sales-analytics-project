import os
import sys
import io
import time
from datetime import datetime, timedelta

print("SCRIPT STARTED", flush=True)

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("IMPORTING MODULES...", flush=True)
try:
    from services.meetalfred_client import fetch_actions, sync_actions, make_linkedin_url, parse_meetalfred_date, make_action_external_id
    from crud import upsert_lead, upsert_action
    from models import Profile, Campaign, Action, Lead
    from database import SessionLocal
    import httpx
    print("IMPORTS SUCCESSFUL", flush=True)
except Exception as e:
    print(f"IMPORT ERROR: {e}", flush=True)
    sys.exit(1)

def quick_recovery_sync():
    db = SessionLocal()
    profiles = db.query(Profile).all()
    
    action_types_mapping = {
        "invites": "invited",
        "accepted": "accepted",
        "messages": "message sent",
        "replies": "replied"
    }

    # We only care about data around May 13th for now
    target_date = datetime(2026, 5, 10).date()

    print(f"!!! Starting QUICK RECOVERY SYNC (From {target_date}) !!!", flush=True)
    
    total_new_actions = 0
    
    for profile in profiles:
        print(f"Processing profile: {profile.name}", flush=True)
        for api_action_type, our_action_type in action_types_mapping.items():
            print(f"  Fetching {api_action_type}...", flush=True)
            page = 0
            while True:
                # Page limit for quick sync
                if page > 10: break
                
                try:
                    time.sleep(5.0) # Even slower to be safe
                    actions_data = fetch_actions(profile.api_key, api_action_type, page=page, per_page=100)
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 429:
                        print(f"    Rate limited. Waiting 60 seconds...", flush=True)
                        time.sleep(60)
                        continue
                    break
                except Exception as e:
                    break
                
                if not actions_data: break
                
                print(f"    Processing page {page}...", flush=True)
                stop_this_type = False
                for act in actions_data:
                    created_at = act.get("created_at")
                    performed_at = parse_meetalfred_date(created_at)
                    
                    if performed_at and performed_at.date() < target_date:
                        stop_this_type = True
                        continue

                    lead_urn = (act.get("lead", {}).get("object_urn") or act.get("lead", {}).get("person", {}).get("object_urn"))
                    if not lead_urn: continue
                    
                    person = act.get("lead", {}).get("person", {})
                    lead_data = {k: v for k, v in {
                        "first_name": person.get("first_name", ""),
                        "last_name": person.get("last_name", ""),
                        "email": person.get("email"),
                        "work_email": person.get("work_email"),
                        "linkedin_handle": person.get("linkedin_handle"),
                        "linkedin_url": make_linkedin_url(person.get("linkedin_handle")) if person.get("linkedin_handle") else None,
                        "current_employer": person.get("current_employer"),
                        "current_title": person.get("current_title"),
                    }.items() if v is not None}
                    
                    lead = upsert_lead(db, external_id=person.get("key"), object_urn=lead_urn, **lead_data)
                    
                    campaign_key = act.get("lead", {}).get("campaign", {}).get("key")
                    if not campaign_key: continue
                    
                    campaign = db.query(Campaign).filter(Campaign.profile_id == profile.id, Campaign.external_id == str(campaign_key)).first()
                    if not campaign: continue
                    
                    action_ext_id = make_action_external_id(lead_urn, campaign_key, created_at, act.get("desc", ""), act.get("msg", "") or "")
                    if not db.query(Action).filter(Action.external_id == action_ext_id).first():
                        upsert_action(db, external_id=action_ext_id, action_type=our_action_type, message=act.get("msg", "") or "", 
                                      performed_at=performed_at, lead_id=lead.id, campaign_id=campaign.id, profile_id=profile.id)
                        total_new_actions += 1

                if stop_this_type or len(actions_data) < 100: break
                page += 1
            db.commit()
                
    db.close()
    print(f"!!! Recovery Sync Complete. Added {total_new_actions} actions. !!!", flush=True)

if __name__ == "__main__":
    quick_recovery_sync()
