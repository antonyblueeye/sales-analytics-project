import requests
from datetime import date

# Test with a range that SHOULD have different results
params1 = {
    "from_date": "2026-04-17",
    "to_date": "2026-04-17"
}
params2 = {
    "from_date": "2026-04-10",
    "to_date": "2026-04-10"
}

r1 = requests.get("http://localhost:8000/analytics/recent-replies", params=params1)
r2 = requests.get("http://localhost:8000/analytics/recent-replies", params=params2)

print(f"R1 (Today) Count: {len(r1.json())}")
if r1.json(): print(f"R1 First: {r1.json()[0]['performed_at']}")

print(f"R2 (Apr 10) Count: {len(r2.json())}")
if r2.json(): print(f"R2 First: {r2.json()[0]['performed_at']}")
