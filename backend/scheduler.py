import os
import threading
from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
from services.meetalfred_client import sync_all_profiles_data
from services.template_service import process_campaign_templates
from backup_db import backup_database

# Default: once per day (1440 min). Override via SYNC_INTERVAL_MINUTES.
SYNC_INTERVAL_MINUTES = int(os.getenv("SYNC_INTERVAL_MINUTES", "1440"))
ENABLE_SCHEDULED_BACKUP = os.getenv("ENABLE_SCHEDULED_BACKUP", "false").lower() in ("1", "true", "yes")

_sync_lock = threading.Lock()
_sync_in_progress = False


def is_sync_in_progress() -> bool:
    return _sync_in_progress


def run_sync_all_job() -> dict:
    """Full sync job: MeetAlfred data + template mapping (+ optional backup)."""
    global _sync_in_progress

    with _sync_lock:
        if _sync_in_progress:
            return {"status": "already_running"}
        _sync_in_progress = True

    print("[Sync] Запуск синхронизации всех профилей...")
    db = SessionLocal()
    try:
        sync_result = sync_all_profiles_data(db)
        print(f"[Sync] Синхронизация завершена: {sync_result}")

        template_result = process_campaign_templates(db)
        print(f"[Sync] Обработка шаблонов завершена: {template_result} новых связей.")

        if ENABLE_SCHEDULED_BACKUP:
            print("[Sync] Запуск планового бэкапа базы...")
            backup_database()
        else:
            print("[Sync] Плановый бэкап пропущен (ENABLE_SCHEDULED_BACKUP=false)")

        return {
            "status": "ok",
            "sync": sync_result,
            "templates_processed": template_result,
        }
    except Exception as e:
        print(f"[Sync] Ошибка: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
        with _sync_lock:
            _sync_in_progress = False


def job_sync_all():
    run_sync_all_job()


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(job_sync_all, "interval", minutes=SYNC_INTERVAL_MINUTES)
    scheduler.start()
    hours = SYNC_INTERVAL_MINUTES / 60
    if SYNC_INTERVAL_MINUTES >= 1440 and SYNC_INTERVAL_MINUTES % 1440 == 0:
        print(f"[Scheduler] Планировщик запущен, синхронизация каждые {int(SYNC_INTERVAL_MINUTES / 1440)} д.")
    elif SYNC_INTERVAL_MINUTES >= 60 and SYNC_INTERVAL_MINUTES % 60 == 0:
        print(f"[Scheduler] Планировщик запущен, синхронизация каждые {int(hours)} ч.")
    else:
        print(f"[Scheduler] Планировщик запущен, синхронизация каждые {SYNC_INTERVAL_MINUTES} мин.")
