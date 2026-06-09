import os
from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
from services.meetalfred_client import sync_all_profiles_data
from services.template_service import process_campaign_templates
from backup_db import backup_database
import logging

SYNC_INTERVAL_MINUTES = int(os.getenv("SYNC_INTERVAL_MINUTES", "360"))
ENABLE_SCHEDULED_BACKUP = os.getenv("ENABLE_SCHEDULED_BACKUP", "false").lower() in ("1", "true", "yes")

def job_sync_all():
    print("[Scheduler] Запуск синхронизации всех профилей...")
    db = SessionLocal()
    try:
        # 1. Sync actions from MeetAlfred
        sync_result = sync_all_profiles_data(db)
        print(f"[Scheduler] Синхронизация завершена: {sync_result}")
        
        # 2. Process templates for new actions
        template_result = process_campaign_templates(db)
        print(f"[Scheduler] Обработка шаблонов завершена: {template_result} новых связей.")
        
        # 3. Резервное копирование базы (отключено на Railway по умолчанию)
        if ENABLE_SCHEDULED_BACKUP:
            print("[Scheduler] Запуск планового бэкапа базы...")
            backup_database()
        else:
            print("[Scheduler] Плановый бэкап пропущен (ENABLE_SCHEDULED_BACKUP=false)")
        
    except Exception as e:
        print(f"[Scheduler] Ошибка: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(job_sync_all, 'interval', minutes=SYNC_INTERVAL_MINUTES)
    scheduler.start()
    print(f"[Scheduler] Планировщик запущен, синхронизация каждые {SYNC_INTERVAL_MINUTES} мин.")