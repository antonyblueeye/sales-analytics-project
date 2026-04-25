from fastapi.testclient import TestClient
from main import app

# Создаем клиента для тестов
client = TestClient(app)

def test_read_root():
    """Проверяем, что главная страница бэкенда отвечает 200 OK"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Привет, мир!"}

def test_crm_leads_list():
    """Проверяем, что API списка лидов работает и возвращает структуру с лидами"""
    response = client.get("/crm/leads?page=1&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "leads" in data
    assert "total" in data
    assert isinstance(data["leads"], list)

def test_analytics_summary():
    """Проверяем, что аналитика возвращает данные"""
    # Исправил адрес на существующий в main.py
    response = client.get("/analytics/profiles-summary?from_date=2024-04-01&to_date=2026-04-25")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
