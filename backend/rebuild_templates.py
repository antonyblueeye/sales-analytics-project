from database import SessionLocal, engine
from sqlalchemy import text
from models import MessageTemplate, MessageTemplateMap
from services.template_service import process_campaign_templates

def rebuild():
    db = SessionLocal()
    print("Clearing templates tables...")
    # Use CASCADE to handle foreign keys
    db.execute(text("TRUNCATE message_templates_map, message_templates RESTART IDENTITY CASCADE"))
    db.commit()
    
    print("Re-processing all templates with new logic...")
    process_campaign_templates(db)
    db.close()
    print("Rebuild complete!")

if __name__ == "__main__":
    rebuild()
