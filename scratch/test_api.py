import requests
from datetime import date

params = {
    "from_date": "2026-04-10",
    "to_date": "2026-04-17"
}
try:
    r = requests.get("http://localhost:8000/analytics/recent-replies", params=params)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"Count: {len(data)}")
        if data:
            print(f"First element campaign: {data[0].get('campaign_name')}")
    else:
        print(r.text)
except Exception as e:
    print(f"Error: {e}")
