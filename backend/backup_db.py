import os
import subprocess
from datetime import datetime

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/meetalfred_db")

def backup_database():
    # Создаем папку для бэкапов, если её нет
    backup_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")
    os.makedirs(backup_dir, exist_ok=True)

    # Имя файла бэкапа с текущей датой и временем
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_file = os.path.join(backup_dir, f"meetalfred_db_backup_{timestamp}.sql")

    print(f"Starting database backup to: {backup_file}")
    
    # Команда pg_dump
    # Используем полный путь к версии 18, чтобы избежать конфликта версий
    pg_dump_path = r"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
    if not os.path.exists(pg_dump_path):
        pg_dump_path = "pg_dump" # fallback to PATH
        
    command = [
        pg_dump_path,
        "--dbname", DB_URL,
        "--file", backup_file,
        "--format=p",  # Plain text SQL format (удобно для чтения и восстановления)
        "--clean"      # Добавляет команды DROP TABLE перед созданием (удобно для восстановления поверх)
    ]

    try:
        # Выполняем команду
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print("[OK] Backup completed successfully!")
        print(f"File saved at: {backup_file}")
        print("To restore this backup later, run:")
        print(f"python restore_db.py \"{backup_file}\"")
    except subprocess.CalledProcessError as e:
        print("[ERROR] Backup failed!")
        print(f"Error: {e.stderr}")
        print("\nNote: Make sure PostgreSQL tools (pg_dump) are installed and added to your system PATH.")
    except FileNotFoundError:
        print("[ERROR] 'pg_dump' command not found!")
        print("Please ensure PostgreSQL is installed and its 'bin' directory is in your Windows PATH.")

if __name__ == "__main__":
    backup_database()
