from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
from services.meetalfred_client import sync_all_profiles_data
from services.template_service import process_campaign_templates

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
        
    except Exception as e:
        print(f"[Scheduler] Ошибка: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Запускать задачу каждые 60 минут
    scheduler.add_job(job_sync_all, 'interval', minutes=60)
    scheduler.start()
    print("[Scheduler] Планировщик запущен, синхронизация и разбор шаблонов будут выполняться каждый час.")