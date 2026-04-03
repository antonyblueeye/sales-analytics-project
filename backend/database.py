from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Строка подключения к PostgreSQL
# Формат: postgresql://user:password@host:port/database_name
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:8876700@localhost:5432/meetalfred_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Функция, которая будет возвращать сессию для запросов
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()