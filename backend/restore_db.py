import sys
import os
import subprocess

DB_URL = "postgresql://postgres:8876700@localhost:5432/meetalfred_db"

def restore_database(backup_file):
    if not os.path.exists(backup_file):
        print(f"❌ Error: Backup file not found at {backup_file}")
        return

    print("=========================================================")
    print("WARNING: You are about to OVERWRITE your current database")
    print(f"with the backup from: {backup_file}")
    print("All data added after this backup was created will be LOST.")
    print("=========================================================")
    
    confirm = input("Are you absolutely sure you want to proceed? (yes/no): ")
    if confirm.lower() != "yes":
        print("Restore cancelled.")
        return

    print(f"Starting database restore from: {backup_file}")
    
    # Команда psql
    command = [
        "psql",
        "--dbname", DB_URL,
        "--file", backup_file
    ]

    try:
        # psql prints a lot of output, we can suppress it or capture it
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print("[OK] Restore completed successfully!")
    except subprocess.CalledProcessError as e:
        print("[ERROR] Restore failed!")
        # Print the last 1000 chars of stderr to avoid huge console dumps
        print(f"Error output:\n{e.stderr[-1000:]}")
        print("\nNote: Make sure PostgreSQL tools (psql) are installed and in your system PATH.")
    except FileNotFoundError:
        print("[ERROR] 'psql' command not found!")
        print("Please ensure PostgreSQL is installed and its 'bin' directory is in your Windows PATH.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python restore_db.py path/to/backup_file.sql")
    else:
        restore_database(sys.argv[1])
