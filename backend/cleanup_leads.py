# backend/cleanup_leads.py
import sys
import io
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Lead, Action
from sqlalchemy import func

# Fix for Windows console encoding
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def merge_leads(db: Session):
    print("Starting deduplication process...")
    
    # 1. Deduplicate by linkedin_url
    duplicate_urls = db.query(Lead.linkedin_url).filter(Lead.linkedin_url.isnot(None), Lead.linkedin_url != '').group_by(Lead.linkedin_url).having(func.count(Lead.id) > 1).all()
    
    for (url,) in duplicate_urls:
        leads = db.query(Lead).filter(Lead.linkedin_url == url).order_by(Lead.created_at.asc()).all()
        winner = leads[0]
        losers = leads[1:]
        
        print(f"Merging {len(losers)} duplicates into Lead ID {winner.id} (URL: {url})")
        
        for loser in losers:
            db.query(Action).filter(Action.lead_id == loser.id).update({Action.lead_id: winner.id})
            if not winner.external_id and loser.external_id: winner.external_id = loser.external_id
            if not winner.object_urn and loser.object_urn: winner.object_urn = loser.object_urn
            db.delete(loser)
        db.commit()

    # 2. Deduplicate by Name (if URL is missing or after URL cleanup)
    duplicate_names = db.query(Lead.first_name, Lead.last_name).group_by(Lead.first_name, Lead.last_name).having(func.count(Lead.id) > 1).all()
    
    for fname, lname in duplicate_names:
        if not fname or not lname: continue
        leads = db.query(Lead).filter(Lead.first_name == fname, Lead.last_name == lname).order_by(Lead.created_at.asc()).all()
        if len(leads) <= 1: continue
            
        winner = leads[0]
        losers = leads[1:]
        
        print(f"Merging {len(losers)} variants of {fname} {lname} based on Name match...")
        
        for loser in losers:
            db.query(Action).filter(Action.lead_id == loser.id).update({Action.lead_id: winner.id})
            if not winner.external_id and loser.external_id: winner.external_id = loser.external_id
            if not winner.object_urn and loser.object_urn: winner.object_urn = loser.object_urn
            if not winner.linkedin_url and loser.linkedin_url: winner.linkedin_url = loser.linkedin_url
            if not winner.email and loser.email: winner.email = loser.email
            db.delete(loser)
        db.commit()

    print("Deduplication complete.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        merge_leads(db)
    finally:
        db.close()
