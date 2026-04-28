import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=False, index=True)  # id из MeetAlfred
    name = Column(String)
    status = Column(String)                                 # active, draft, archived
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_synced_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    profile = relationship("Profile", back_populates="campaigns")

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True, nullable=True)  # person.key

    object_urn = Column(String, index=True, nullable=True)

    # Личные данные
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    work_email = Column(String)
    linkedin_handle = Column(String)
    linkedin_url = Column(String)
    photo_url = Column(String)

    # Работа и место
    current_employer = Column(String)
    current_title = Column(String)
    location = Column(String)

    # Соцсети
    twitter_handle = Column(String)

    # Дата создания записи в нашей базе
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True, nullable=False)

    action_type = Column(String, nullable=False)
    message = Column(String)
    performed_at = Column(DateTime(timezone=True), nullable=False, index=True)

    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_synced_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)   # например, "Volodymyr Paslavskyy"
    api_key = Column(String, unique=True, nullable=False)  # API ключ
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    campaigns = relationship("Campaign", back_populates="profile")

class MessageTemplate(Base):
    __tablename__ = "message_templates"

    id = Column(Integer, primary_key=True, index=True)
    template = Column(String, nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False, index=True)
    step_index = Column(Integer, nullable=False)  # 0 for invitation, 1+ for messages
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship to the map
    actions_map = relationship("MessageTemplateMap", back_populates="template")

class MessageTemplateMap(Base):
    __tablename__ = "message_templates_map"

    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("actions.id"), unique=True, nullable=False)
    message_template_id = Column(Integer, ForeignKey("message_templates.id"), nullable=False)
    replied = Column(Boolean, default=False)
    accepted = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    template = relationship("MessageTemplate", back_populates="actions_map")
    action = relationship("Action")