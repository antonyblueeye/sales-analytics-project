from database import engine
from sqlalchemy import text

def migrate():
    print("Migrating replied column to Boolean...")
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE message_templates_map ALTER COLUMN replied TYPE BOOLEAN USING replied::text::boolean;"))
        conn.commit()
    print("Migration successful!")

if __name__ == "__main__":
    migrate()
