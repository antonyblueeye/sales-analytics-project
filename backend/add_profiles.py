from database import SessionLocal
from models import Profile

# Вызываем этот скрипт для добавления новых профилей в базу, или для обновления информации по профилям, которые уже лежат в базе

def add_profiles():
    db = SessionLocal()
    profiles_data = [
        {"name": "Volodymyr Paslavskyy", "api_key": "I34zuNuHsDuYCpGnzdJUVxmNThD5X9uz"},
        {"name": "Volodymyr Vavrykovych", "api_key": "5n1jQCWrxOPUaG1p6mbZ6VQ5Omea4QAo"},
        {"name": "Nazar Vyshnytskyi", "api_key": "Pm33NucVymMig9QfaKhvjDoT1wxZoRRN"},
        {"name": "Svitlana Vavrykovych", "api_key": "F54LU8BFl2gdl1l1Dl16vtYDXC5cksQz"}
    ]
    for p in profiles_data:
        existing = db.query(Profile).filter(Profile.api_key == p["api_key"]).first()
        if not existing:
            profile = Profile(name=p["name"], api_key=p["api_key"])
            db.add(profile)
            print(f"Added profile: {p['name']}")
        else:
            print(f"Profile {p['name']} already exists")
    db.commit()
    db.close()

if __name__ == "__main__":
    add_profiles()