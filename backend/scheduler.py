from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
from services.meetalfred_client import sync_all_profiles_data

def job_sync_all():
    print("[Scheduler] Запуск синхронизации всех профилей...")
    db = SessionLocal()
    try:
        result = sync_all_profiles_data(db)
        print(f"[Scheduler] Результат: {result}")
    except Exception as e:
        print(f"[Scheduler] Ошибка: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Запускать задачу каждые 60 минут (можно настроить)
    scheduler.add_job(job_sync_all, 'interval', minutes=60)
    scheduler.start()
    print("[Scheduler] Планировщик запущен, синхронизация будет выполняться каждый час.")