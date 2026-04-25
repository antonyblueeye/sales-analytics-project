from database import SessionLocal, engine
from sqlalchemy import text
from models import MessageTemplate, MessageTemplateMap
from services.template_service import process_campaign_templates

def rebuild():
    print("=========================================================")
    print("WARNING: This script will WIPE all message templates and")
    print("rebuild them from scratch. This takes ~30-40 minutes.")
    print("DO NOT close the terminal or interrupt this process,")
    print("otherwise the templates table will be left empty!")
    print("=========================================================")
    confirm = input("Are you sure you want to proceed? (yes/no): ")
    if confirm.lower() != "yes":
        print("Rebuild cancelled.")
        return

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
