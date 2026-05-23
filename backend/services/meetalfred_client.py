import httpx # type: ignore
import hashlib
from typing import List, Dict, Any, Optional
from dateutil import parser
from models import Lead, Campaign, Action
from sqlalchemy.orm import Session # type: ignore
from crud import upsert_campaign, upsert_lead, upsert_action   # импортируем функцию из корневого crud.py

BASE_URL = "https://meetalfred.com/api/integrations/webhook"
TIMEOUT = 60.0  # Увеличили таймаут до 60 секунд

def make_action_external_id(lead_urn, campaign_key, created_at, desc, msg):
    # Объединяем все поля в одну строку через разделитель, например "|"
    raw = f"{lead_urn}|{campaign_key}|{created_at}|{desc}|{msg}"
    # Создаём MD5-хеш (32 символа)
    return hashlib.md5(raw.encode('utf-8')).hexdigest()

def make_linkedin_url(handle: str) -> Optional[str]:
    """Превращает linkedin_handle в красивую ссылку на профиль"""
    if handle:
        return f"https://www.linkedin.com/in/{handle}/"
    return None

def parse_meetalfred_date(date_str: str):
    if not date_str:
        return None
    try:
        return parser.parse(date_str)
    except Exception as e:
        print(f"Ошибка парсинга даты '{date_str}': {e}")
        return None

def fetch_campaigns(api_key: str, campaign_type: str = "active") -> List[Dict[str, Any]]:
    """
    Получает ВСЕ кампании из MeetAlfred с учётом пагинации.
    - api_key: webhook_key
    - campaign_type: active, draft, archived, all
    Возвращает список словарей с данными кампаний.
    """
    all_campaigns = []
    page = 1
    per_page = 100   # оптимальное количество записей на странице

    with httpx.Client(timeout=TIMEOUT) as client:
        while True:
            params = {
                "webhook_key": api_key,
                "type": campaign_type,
                "page": page,
                "per_page": per_page
            }
            response = client.get(f"{BASE_URL}/campaigns", params=params)
            response.raise_for_status()          # вызовет исключение при ошибке
            data = response.json()

            campaigns = data.get("campaigns", [])
            if not campaigns:
                break

            all_campaigns.extend(campaigns)

            # Если вернулось меньше, чем per_page — это последняя страница
            if len(campaigns) < per_page:
                break

            page += 1

    print(f"[MeetAlfred] Получено кампаний: {len(all_campaigns)} (тип: {campaign_type})")
    return all_campaigns

def fetch_new_leads(api_key: str, page: int = 0, per_page: int = 100) -> List[Dict[str, Any]]:
    """
    Получает все действия (actions) из эндпоинта new-leads с пагинацией.
    Возвращает список actions (каждый action содержит person, campaign и т.д.)
    """
    all_actions = []
    current_page = page

    with httpx.Client(timeout=TIMEOUT) as client:
        while True:
            params = {
                "webhook_key": api_key,
                "page": current_page,
                "per_page": per_page
            }
            response = client.get(f"{BASE_URL}/new-leads", params=params)
            response.raise_for_status()
            data = response.json()

            actions = data.get("actions", [])
            if not actions:
                break

            all_actions.extend(actions)

            # Если получили меньше, чем просили, значит это последняя страница
            if len(actions) < per_page:
                break

            current_page += 1

    print(f"[MeetAlfred] Получено действий (лидов): {len(all_actions)}")
    return all_actions

def fetch_actions(api_key: str, action_type: str, page: int = 0, per_page: int = 100) -> List[Dict[str, Any]]:
    """
    Получает все действия определённого типа из эндпоинта get-last-actions.
    action_type: 'invites', 'accepted', 'messages', 'replies'
    """
    all_actions = []
    current_page = page

    with httpx.Client(timeout=TIMEOUT) as client:
        while True:
            params = {
                "webhook_key": api_key,
                "action": action_type,
                "page": current_page,
                "per_page": per_page
            }
            response = client.get(f"{BASE_URL}/get-last-actions", params=params)
            response.raise_for_status()
            data = response.json()
            actions = data.get("actions", [])
            if not actions:
                break
            all_actions.extend(actions)
            if len(actions) < per_page:
                break
            current_page += 1

    print(f"[MeetAlfred] Получено действий типа {action_type}: {len(all_actions)}")
    return all_actions

def sync_campaigns(db: Session, profile_id: int, api_key: str, campaign_type: str = "active") -> dict:
    campaigns_data = fetch_campaigns(api_key, campaign_type)

    processed = 0
    for camp in campaigns_data:
        external_id = str(camp.get("id"))
        name = camp.get("label", "")
        status = camp.get("status", "")

        upsert_campaign(db, profile_id, external_id, name, status)
        processed += 1

    return {"processed": processed}

def sync_leads(db: Session, profile_id: int, api_key: str) -> dict:
    """
    Синхронизирует лидов (справочник) из MeetAlfred.
    Для каждого action извлекает person и сохраняет/обновляет лида.
    profile_id нужен, только чтобы знать, для какого профиля делаем запрос,
    но в таблицу leads он не записывается (справочник общий).
    """
    actions = fetch_new_leads(api_key)
    processed = 0

    for action in actions:
        person = action.get("person", {})
        external_id = person.get("key")
        if not external_id:
            continue   # без ключа лида не можем сохранить

        # Извлекаем данные из person
        first_name = person.get("first_name", "")
        last_name = person.get("last_name", "")
        email = person.get("email")
        work_email = person.get("work_email")
        linkedin_handle = person.get("linkedin_handle")
        linkedin_url = make_linkedin_url(linkedin_handle) if linkedin_handle else None
        photo_url = person.get("linkedin_data", {}).get("pic") if person.get("linkedin_data") else None
        current_employer = person.get("current_employer")
        current_title = person.get("current_title")
        location = person.get("location")
        twitter_handle = person.get("twitter_handle")
        object_urn = person.get("object_urn") or person.get("linkedin_data", {}).get("objectUrn")

        # Сохраняем/обновляем лида
        upsert_lead(
            db,
            external_id=external_id,
            object_urn=object_urn,
            first_name=first_name,
            last_name=last_name,
            email=email,
            work_email=work_email,
            linkedin_handle=linkedin_handle,
            linkedin_url=linkedin_url,
            photo_url=photo_url,
            current_employer=current_employer,
            current_title=current_title,
            location=location,
            twitter_handle=twitter_handle,
        )
        processed += 1

    return {"leads_processed": processed}

def sync_actions(db: Session, profile_id: int, api_key: str) -> dict:
    """
    Синхронизирует действия (invites, accepted, messages, replies) для одного профиля.
    Если лида нет в БД, создаёт его из данных действия (через upsert_lead).
    """
    action_types_mapping = {
        "invites": "invited",
        "accepted": "accepted",
        "messages": "message sent",
        "replies": "replied"
    }

    stats = {
        "total_actions_fetched": 0,
        "no_lead_urn": 0,
        "lead_upsert_called": 0,   # сколько раз вызывали upsert_lead (создание/обновление лида)
        "no_campaign_key": 0,
        "campaign_not_in_db": 0,
        "no_created_at": 0,
        "invalid_date": 0,
        "duplicate_external_id": 0,
        "success": 0
    }

    for api_action_type, our_action_type in action_types_mapping.items():
        actions_data = fetch_actions(api_key, api_action_type)
        stats["total_actions_fetched"] += len(actions_data)

        for act in actions_data:
            # 1. Получаем object_urn лида
            lead_urn = (
                act.get("lead", {}).get("object_urn") or
                act.get("lead", {}).get("person", {}).get("object_urn")
            )
            if not lead_urn:
                stats["no_lead_urn"] += 1
                continue

            # 2. Извлекаем данные лида из поля person (если есть)
            person = act.get("lead", {}).get("person", {})
            lead_external_id = person.get("key")  # может быть None
            lead_data = {
                "first_name": person.get("first_name", ""),
                "last_name": person.get("last_name", ""),
                "email": person.get("email"),
                "work_email": person.get("work_email"),
                "linkedin_handle": person.get("linkedin_handle"),
                "linkedin_url": make_linkedin_url(person.get("linkedin_handle")) if person.get("linkedin_handle") else None,
                "photo_url": person.get("linkedin_data", {}).get("pic") if person.get("linkedin_data") else None,
                "current_employer": person.get("current_employer"),
                "current_title": person.get("current_title"),
                "location": person.get("location"),
                "twitter_handle": person.get("twitter_handle"),
            }
            # Убираем поля со значением None (чтобы не перезаписывать существующие данные)
            lead_data = {k: v for k, v in lead_data.items() if v is not None}

            # 3. Создаём или обновляем лида
            lead = upsert_lead(
                db,
                external_id=lead_external_id,
                object_urn=lead_urn,
                **lead_data
            )
            stats["lead_upsert_called"] += 1

            # 4. Получаем campaign key
            campaign_key = act.get("lead", {}).get("campaign", {}).get("key")
            if not campaign_key:
                stats["no_campaign_key"] += 1
                continue

            # 5. Ищем кампанию в БД
            campaign = db.query(Campaign).filter(
                Campaign.profile_id == profile_id,
                Campaign.external_id == str(campaign_key)
            ).first()
            if not campaign:
                stats["campaign_not_in_db"] += 1
                continue

            # 6. Дата
            created_at = act.get("created_at")
            if not created_at:
                stats["no_created_at"] += 1
                continue
            performed_at = parse_meetalfred_date(created_at)
            if not performed_at:
                stats["invalid_date"] += 1
                continue

            # 7. external_id для действия (хеш)
            desc = act.get("desc", "")
            msg = act.get("msg", "") or ""
            action_ext_id = make_action_external_id(lead_urn, campaign_key, created_at, desc, msg)

            # 8. Проверяем дубликат действия
            existing = db.query(Action).filter(Action.external_id == action_ext_id).first()
            if existing:
                stats["duplicate_external_id"] += 1
                continue

            # 9. Сохраняем действие
            upsert_action(
                db,
                external_id=action_ext_id,
                action_type=our_action_type,
                message=msg,
                performed_at=performed_at,
                lead_id=lead.id,
                campaign_id=campaign.id,
                profile_id=profile_id
            )
            stats["success"] += 1

    print("\n===== СТАТИСТИКА СИНХРОНИЗАЦИИ ДЕЙСТВИЙ =====")
    for key, value in stats.items():
        print(f"{key}: {value}")
    print("============================================\n")

    return {"actions_processed": stats["success"]}

def sync_all_profiles_data(db: Session) -> dict:
    from models import Profile
    profiles = db.query(Profile).all()
    results = {}
    for profile in profiles:
        print(f"[Sync] Синхронизация для профиля {profile.name}")
        try:
            campaigns_result = sync_campaigns(db, profile.id, profile.api_key, campaign_type="all")  # type: ignore[arg-type]
            leads_result = sync_leads(db, profile.id, profile.api_key)  # type: ignore[arg-type]
            actions_result = sync_actions(db, profile.id, profile.api_key)  # type: ignore[arg-type]
            results[profile.name] = {
                "campaigns": campaigns_result,
                "leads": leads_result,
                "actions": actions_result
            }
        except Exception as e:
            results[profile.name] = {"error": str(e)}
    return results