from database import engine, Base
from models import MessageTemplate, MessageTemplateMap
import models

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Done!")

if __name__ == "__main__":
    init_db()
