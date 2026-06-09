import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import text, and_, func
from sqlalchemy.orm import Session, Mapped, mapped_column
from database import engine, get_db
from services.meetalfred_client import sync_campaigns
from scheduler import start_scheduler
from models import Base, Campaign, Profile, Lead, Action
from analytics import get_total_actions, get_total_leads, get_profiles_summary, get_campaigns_summary, get_campaigns_list, get_campaign_history, get_recent_replies, get_funnel_history
from typing import Optional
from datetime import datetime, time, timedelta, date
from crm import get_leads_list, get_replied_leads, get_lead_activities, get_lead_by_id, search_leads

app = FastAPI()

MAX_PAGE_LIMIT = 100
MAX_ACTIONS_LIMIT = 500

def _clamp_limit(limit: int, default: int = 20, maximum: int = MAX_PAGE_LIMIT) -> int:
    if limit < 1:
        return default
    return min(limit, maximum)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
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
    from models import Profile
    profile = db.query(Profile).filter(Profile.api_key == api_key).first()
    if not profile:
        return {"error": "Профиль с таким API-ключом не найден"}
    result = sync_campaigns(db, profile.id, api_key, campaign_type)  # type: ignore[arg-type]
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
    result = sync_leads(db, profile.id, api_key)  # type: ignore[arg-type]
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
    result = sync_actions(db, profile.id, api_key)  # type: ignore[arg-type]
    return {"status": "ok", "result": result}

@app.get("/actions")
def get_actions(
    limit: int = Query(100, ge=1, le=MAX_ACTIONS_LIMIT),
    db: Session = Depends(get_db)
):
    actions = db.query(Action).order_by(Action.performed_at.desc()).limit(limit).all()
    return actions

@app.get("/campaigns")
def get_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).all()
    return campaigns

@app.get("/profiles")
def get_profiles(db: Session = Depends(get_db)):
    profiles = db.query(Profile).all()
    return [{"id": p.id, "name": p.name} for p in profiles]

# Нужно запомнить, что пост запросы вызываются только через /docs, а не прописываются в 
# браузерной строке
@app.post("/sync-all")
def sync_all(db: Session = Depends(get_db)):
    from services.meetalfred_client import sync_all_profiles_data
    result = sync_all_profiles_data(db)
    return {"status": "ok", "results": result}

@app.get("/analytics/last-sync")
def last_sync(db: Session = Depends(get_db)):
    result = db.query(func.max(Action.last_synced_at)).scalar()
    return {"last_synced_at": result.isoformat() if result else None}

@app.get("/analytics/funnel-history")
def funnel_history(
    granularity: str = Query('day', description="day, week или month"),
    db: Session = Depends(get_db)
):
    return get_funnel_history(db, granularity)

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
    include_messages: bool = False,
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
    campaign: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    data = get_leads_list(
        db, page, _clamp_limit(limit), search,
        first_name, last_name, company,
        location, title,
        create_date_from, create_date_to,
        activity_date_from, activity_date_to,
        campaign, status,
        include_messages=include_messages,
    )
    return data

@app.get("/crm/replied-leads")
def crm_replied_leads(
    page: int = 1,
    limit: int = 20,
    include_messages: bool = False,
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
    campaign: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    data = get_replied_leads(
        db, page, _clamp_limit(limit), search,
        first_name, last_name, company,
        location, title,
        create_date_from, create_date_to,
        activity_date_from, activity_date_to,
        campaign, status,
        include_messages=include_messages,
    )
    return data

@app.get("/crm/leads/search")
def crm_search_leads(
    q: str = "",
    limit: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
):
    if not q or len(q.strip()) < 2:
        return []
    return search_leads(db, q.strip(), limit)

@app.get("/crm/leads/{lead_id}")
def crm_lead_by_id(lead_id: int, db: Session = Depends(get_db)):
    return get_lead_by_id(db, lead_id)

@app.get("/crm/leads/{lead_id}/activities")
def crm_lead_activities(
    lead_id: int,
    db: Session = Depends(get_db)
):
    return get_lead_activities(db, lead_id)

from pydantic import BaseModel

class ActivityCreate(BaseModel):
    type: str
    message: str
    date: str
    campaign_name: str
    profile_name: str


class LeadCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    campaign_name: Optional[str] = None
    profile_name: Optional[str] = None

@app.post("/crm/leads/{lead_id}/activities")
def create_lead_activity(
    lead_id: int,
    activity: ActivityCreate,
    db: Session = Depends(get_db)
):
    from crm import add_lead_activity
    return add_lead_activity(db, lead_id, activity)

@app.delete("/crm/activities/{activity_id}")
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db)
):
    from crm import remove_activity
    return remove_activity(db, activity_id)

@app.post("/crm/leads")
def create_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db)
):
    from crm import add_lead_manual
    return add_lead_manual(db, lead)

@app.get("/analytics/campaigns-list")
def campaigns_list(db: Session = Depends(get_db)):
    from fastapi.responses import JSONResponse
    data = get_campaigns_list(db)
    return JSONResponse(content=data, headers={"Cache-Control": "public, max-age=300"})

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

@app.get("/analytics/campaign-sequence")
def campaign_sequence(
    campaign_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from analytics import get_campaign_sequence
    return get_campaign_sequence(db, campaign_name)

@app.get("/analytics/custom-messages")
def custom_messages_analytics(
    mode: str = "replied", 
    profiles: Optional[list[str]] = Query(None), 
    db: Session = Depends(get_db)
):
    from analytics import get_custom_messages_analytics
    return get_custom_messages_analytics(db, mode, profiles)

@app.get("/analytics/leads")
def leads_analytics(
    campaign: str = "all",
    db: Session = Depends(get_db)
):
    from analytics import get_leads_analytics
    return get_leads_analytics(db, campaign)

@app.get("/analytics/replied-leads-titles")
def replied_leads_titles_analytics(
    campaign: str = "all",
    db: Session = Depends(get_db)
):
    from analytics import get_replied_titles_analytics
    return get_replied_titles_analytics(db, campaign)

@app.get("/analytics/template-conversions")
def template_conversions(
    campaign: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from analytics import get_template_conversion_analytics
    return get_template_conversion_analytics(db, campaign)

@app.get("/analytics/locations")
def locations_analytics(
    campaign: str = "all",
    db: Session = Depends(get_db)
):
    from analytics import get_locations_analytics
    return get_locations_analytics(db, campaign)

@app.get("/analytics/ai-insights")
def ai_insights(
    from_date: date,
    to_date: date,
    db: Session = Depends(get_db)
):
    from analytics import get_profiles_summary, get_total_leads, get_total_actions
    from datetime import datetime, time
    from services.ai_service import generate_profiles_insight
    
    # Get the raw data
    profiles_data = get_profiles_summary(db, from_date, to_date)
    
    # Convert dates to datetime for get_total_*
    from_dt = datetime.combine(from_date, time.min)
    to_dt = datetime.combine(to_date, time.max)
    
    total_leads_val = get_total_leads(db, from_dt, to_dt)
    total_actions_val = get_total_actions(db, from_dt, to_dt)
    
    # Generate insight
    insight_text = generate_profiles_insight(profiles_data, total_leads_val, total_actions_val)
    
    return {"insight": insight_text}
