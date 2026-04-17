# crud.py

from sqlalchemy.orm import Session
from models import Campaign, Profile, Lead, Action

def upsert_campaign(db: Session, profile_id: int, external_id: str, name: str, status: str) -> Campaign:
    # ищем кампанию с таким external_id И таким profile_id
    campaign = db.query(Campaign).filter(
        Campaign.profile_id == profile_id,
        Campaign.external_id == external_id
    ).first()

    if campaign:
        campaign.name = name
        campaign.status = status
    else:
        campaign = Campaign(
            profile_id=profile_id,
            external_id=external_id,
            name=name,
            status=status
        )
        db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def upsert_profile(db: Session, name: str, api_key: str) -> Profile:
    profile = db.query(Profile).filter(Profile.api_key == api_key).first()
    if not profile:
        profile = Profile(name=name, api_key=api_key)
        db.add(profile)
    else:
        profile.name = name
    db.commit()
    db.refresh(profile)
    return profile

def upsert_lead(db: Session, external_id: str = None, object_urn: str = None, **kwargs) -> Lead:
    """
    Добавляет или обновляет лида.
    Сначала ищем по external_id (если передан), затем по object_urn.
    Если не найден – создаём нового.
    """
    lead = None
    if external_id:
        lead = db.query(Lead).filter(Lead.external_id == external_id).first()
    if not lead and object_urn:
        lead = db.query(Lead).filter(Lead.object_urn == object_urn).first()
    
    # Дополнительные критерии: LinkedIn URL и Email
    if not lead and kwargs.get('linkedin_url'):
        lead = db.query(Lead).filter(Lead.linkedin_url == kwargs.get('linkedin_url')).first()
    
    if not lead and kwargs.get('email'):
        lead = db.query(Lead).filter(Lead.email == kwargs.get('email')).first()
    
    if not lead and kwargs.get('first_name') and kwargs.get('last_name'):
        # Рискованно, но как совсем последний шанс (можно закомментировать если слишком агрессивно)
        lead = db.query(Lead).filter(
            Lead.first_name == kwargs.get('first_name'),
            Lead.last_name == kwargs.get('last_name')
        ).first()
    if lead:
        # Обновляем только переданные поля (кроме служебных)
        for key, value in kwargs.items():
            if hasattr(lead, key) and key not in ['id', 'external_id', 'object_urn']:
                setattr(lead, key, value)
        # Если передан external_id или object_urn, но в записи их не было – дополняем
        if external_id and not lead.external_id:
            lead.external_id = external_id
        if object_urn and not lead.object_urn:
            lead.object_urn = object_urn
    else:
        lead = Lead(external_id=external_id, object_urn=object_urn, **kwargs)
        db.add(lead)
    
    db.commit()
    db.refresh(lead)
    return lead

def upsert_action(db: Session, external_id: str, **kwargs) -> Action:
    action = db.query(Action).filter(Action.external_id == external_id).first()

    if action:
        for key, value in kwargs.items():
            if hasattr(action, key) and key != "id":
                setattr(action, key, value)
    else:
        action = Action(external_id=external_id, **kwargs)
        db.add(action)
    
    db.commit()
    db.refresh(action)
    return action