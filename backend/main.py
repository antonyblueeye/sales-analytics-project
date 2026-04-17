import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, and_
from sqlalchemy.orm import Session
from database import engine, get_db
from services.meetalfred_client import sync_campaigns
from scheduler import start_scheduler
from models import Base, Campaign, Profile, Lead, Action
from analytics import get_total_actions, get_total_leads, get_profiles_summary, get_campaigns_summary, get_campaigns_list, get_campaign_history, get_recent_replies
from typing import Optional
from datetime import datetime, time, timedelta, date
from crm import get_leads_list, get_replied_leads

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # адрес твоего фронта
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

start_scheduler()

# Создаём таблицы при запуске (если их ещё нет)
Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Привет, мир!"}

@app.get("/check-db")
def check_db(db: Session = Depends(get_db)):
    # Выполняем простой SQL-запрос, чтобы проверить соединение
    result = db.execute(text("SELECT version()"))
    version = result.scalar()
    return {"postgres_version": version}

@app.post("/sync-campaigns")
def sync_campaigns_endpoint(
    api_key: str = Query(..., description="Ваш webhook_key"),
    campaign_type: str = Query("active", description="Тип кампаний: active, draft, archived, all"),
    db: Session = Depends(get_db)
):
    """
    Запускает синхронизацию кампаний из MeetAlfred.
    """
    result = sync_campaigns(db, api_key, campaign_type)
    return {"status": "ok", "result": result}

@app.post("/sync-leads")
def sync_leads_endpoint(
    api_key: str = Query(..., description="Ваш webhook_key"),
    db: Session = Depends(get_db)
):
    from services.meetalfred_client import sync_leads
    # Находим профиль по api_key
    from models import Profile
    profile = db.query(Profile).filter(Profile.api_key == api_key).first()
    if not profile:
        return {"error": "Профиль с таким API-ключом не найден"}
    result = sync_leads(db, profile.id, api_key)
    return {"status": "ok", "result": result}

@app.post("/sync-actions")
def sync_actions_endpoint(
    api_key: str = Query(..., description="Ваш webhook_key"),
    db: Session = Depends(get_db)
):
    from services.meetalfred_client import sync_actions
    from models import Profile
    profile = db.query(Profile).filter(Profile.api_key == api_key).first()
    if not profile:
        return {"error": "Профиль с таким API-ключом не найден"}
    result = sync_actions(db, profile.id, api_key)
    return {"status": "ok", "result": result}

@app.get("/actions")
def get_actions(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    actions = db.query(Action).order_by(Action.performed_at.desc()).limit(limit).all()
    return actions

@app.get("/campaigns")
def get_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).all()
    return campaigns

# Нужно запомнить, что пост запросы вызываются только через /docs, а не прописываются в 
# браузерной строке
@app.post("/sync-all")
def sync_all(db: Session = Depends(get_db)):
    from services.meetalfred_client import sync_all_profiles_data
    result = sync_all_profiles_data(db)
    return {"status": "ok", "results": result}

@app.get("/analytics/total-actions")
def total_actions(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Преобразуем строки в datetime
    from_dt = None
    to_dt = None
    if from_date:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
    if to_date:
        # Добавляем один день, чтобы включить весь выбранный день
        to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
    
    count = get_total_actions(db, from_dt, to_dt)
    return {"total_actions": count}

@app.get("/analytics/total-leads")
def total_leads(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from_dt = None
    to_dt = None
    if from_date:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
    if to_date:
        to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
    
    count = get_total_leads(db, from_dt, to_dt)
    return {"total_leads": count}

@app.get("/analytics/profiles-summary")
def profiles_summary(
    from_date: date,
    to_date: date,
    db: Session = Depends(get_db)
):
    data = get_profiles_summary(db, from_date, to_date)
    return data

@app.get("/analytics/campaigns-summary")
def campaigns_summary(
    from_date: date,
    to_date: date,
    db: Session = Depends(get_db)
):
    data = get_campaigns_summary(db, from_date, to_date)
    return data

@app.get("/crm/leads")
def crm_leads(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    company: Optional[str] = None,
    location: Optional[str] = None,
    title: Optional[str] = None,
    create_date_from: Optional[str] = None,
    create_date_to: Optional[str] = None,
    activity_date_from: Optional[str] = None,
    activity_date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    data = get_leads_list(
        db, page, limit, search,
        first_name, last_name, company,
        location, title,
        create_date_from, create_date_to,
        activity_date_from, activity_date_to
    )
    return data

@app.get("/crm/replied-leads")
def crm_replied_leads(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    company: Optional[str] = None,
    location: Optional[str] = None,
    title: Optional[str] = None,
    create_date_from: Optional[str] = None,
    create_date_to: Optional[str] = None,
    activity_date_from: Optional[str] = None,
    activity_date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    data = get_replied_leads(
        db, page, limit, search,
        first_name, last_name, company,
        location, title,
        create_date_from, create_date_to,
        activity_date_from, activity_date_to
    )
    return data

@app.get("/analytics/campaigns-list")
def campaigns_list(db: Session = Depends(get_db)):
    return get_campaigns_list(db)

@app.get("/analytics/campaign-history")
def campaign_history(
    campaign_name: str,
    granularity: str = "day",
    db: Session = Depends(get_db)
):
    return get_campaign_history(db, campaign_name, granularity)

@app.get("/analytics/daily-summary")
def daily_summary(
    from_date: date,
    to_date: date,
    db: Session = Depends(get_db)
):
    from analytics import get_daily_summary
    data = get_daily_summary(db, from_date, to_date)
    return data

@app.get("/analytics/recent-replies")
def recent_replies(
    from_date: date,
    to_date: date,
    db: Session = Depends(get_db)
):
    return get_recent_replies(db, from_date, to_date)
