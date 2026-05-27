# LinkedIn Outreach Analytics Platform

Веб-приложение для аналитики LinkedIn outreach-кампаний на базе [MeetAlfred](https://meetalfred.com/). Отслеживает кампании, лидов, ответы и сообщения, визуализирует воронки и генерирует AI-инсайты.

**Live demo:** https://sales-analytics-project.vercel.app/
Войти как **Guest** — увидишь все дашборды с анонимизированными данными (имена лидов, компании и тексты сообщений скрыты).

---

## Возможности

- **Главный дашборд** — суммарная аналитика по invites/replies/connections, динамика по дням, сравнение с предыдущим периодом
- **Кампании** — детальная аналитика по каждой кампании, sequence-сообщений, конверсии шаблонов
- **CRM** — список всех лидов с фильтрами (имя, компания, локация, статус, период активности), карточка лида с историей активности и перепиской
- **Анализ сообщений** — статистика по шаблонам, ответам, кастомным сообщениям
- **Карта мира** — географическое распределение лидов
- **AI-инсайты** — Google Gemini анализирует данные за выбранный период и выдаёт рекомендации
- **Demo-режим** — гостевой доступ с полной анонимизацией PII (личные имена, компании, тексты сообщений размываются)

---

## Технологический стек

### Backend
- **Python** + **FastAPI** — REST API
- **SQLAlchemy** — ORM
- **PostgreSQL** — база данных
- **Pydantic** — валидация
- **APScheduler** — автоматическая синхронизация в фоне
- **httpx** — клиент для MeetAlfred API
- **Google Gemini API** — генерация AI-инсайтов

### Frontend
- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** — стили
- **Recharts** — графики
- **react-simple-maps** + **D3** — интерактивная карта
- **Framer Motion** — анимации
- **Axios** — HTTP-клиент

### Инфраструктура
- **Railway** — backend + PostgreSQL
- **Vercel** — frontend (auto-deploy из main ветки)
- **GitHub** — версионный контроль и CI/CD

---

## Архитектура

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Next.js (Vercel) │ ◄─────► │  FastAPI (Railway) │ ◄─────► │  PostgreSQL     │
│                 │  HTTPS  │                  │   SQL   │  (Railway)      │
└─────────────────┘         └────────┬─────────┘         └─────────────────┘
                                     │
                                     │ Background sync
                                     ▼
                            ┌──────────────────┐
                            │  MeetAlfred API  │
                            │  Google Gemini   │
                            └──────────────────┘
```

---

## Структура проекта

```
sales_project/
├── backend/                    # FastAPI приложение
│   ├── main.py                 # Точка входа, роуты
│   ├── models.py               # SQLAlchemy модели
│   ├── database.py             # Подключение к БД
│   ├── analytics.py            # Бизнес-логика аналитики
│   ├── crm.py                  # CRM-логика (лиды, активности)
│   ├── scheduler.py            # APScheduler фоновые задачи
│   ├── services/
│   │   ├── meetalfred_client.py  # Интеграция с MeetAlfred
│   │   └── ai_service.py         # Интеграция с Gemini
│   ├── requirements.txt
│   ├── Procfile                # Команда запуска для Railway
│   └── .env.example
│
├── frontend-clean/             # Next.js приложение
│   ├── app/
│   │   ├── page.tsx            # Главный дашборд
│   │   ├── layout.tsx          # Корневой layout
│   │   ├── login/              # Страница входа (Guest/Admin)
│   │   ├── crm/                # CRM с лидами
│   │   ├── campaigns/          # Аналитика кампаний и сообщений
│   │   ├── leads/              # Аналитика по лидам
│   │   ├── settings/           # Гайд по приложению
│   │   ├── components/         # Header, Sidebar, графики
│   │   ├── lib/
│   │   │   ├── AuthContext.tsx # Аутентификация (Guest/Admin)
│   │   │   ├── demo.ts         # Логика demo-режима и анонимизации
│   │   │   └── DemoMessage.tsx # Размытие текстов в demo
│   │   └── api/client.ts       # Axios инстанс
│   ├── package.json
│   ├── next.config.mjs         # CSP-заголовки, конфиг
│   └── .env.example
│
└── README.md
```

---

## Запуск локально

### Требования
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

Создай файл `backend/.env` (по образцу `.env.example`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/meetalfred_db
GEMINI_API_KEY=your_gemini_api_key
```

Запуск:

```bash
uvicorn main:app --reload
```

Бэкенд будет доступен на `http://localhost:8000`. Документация API: `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend-clean
npm install
```

Создай файл `frontend-clean/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
```

Запуск:

```bash
npm run dev
```

Фронт будет доступен на `http://localhost:3000`.

---

## Деплой

### Backend (Railway)
1. Создать проект из GitHub репозитория
2. Settings → Source → Root Directory: `backend`
3. Добавить PostgreSQL plugin
4. Variables:
   - `DATABASE_URL` (автоматически от PostgreSQL plugin)
   - `GEMINI_API_KEY`

### Frontend (Vercel)
1. Import Git Repository
2. Root Directory: `frontend-clean`
3. Environment Variables:
   - `NEXT_PUBLIC_API_URL` — URL бэкенда на Railway
   - `NEXT_PUBLIC_ADMIN_PASSWORD` — пароль админа

---

## Аутентификация

- **Guest** — публичный demo-доступ, все данные анонимизированы
- **Admin** — полный доступ через пароль из `NEXT_PUBLIC_ADMIN_PASSWORD`

Логика хранится в `app/lib/AuthContext.tsx`, флаг `DEMO_MODE` в `app/lib/demo.ts` определяет уровень анонимизации.

---

## Основные API endpoints

| Method | Path | Описание |
|--------|------|----------|
| GET | `/analytics/profiles-summary` | Сводка по профилям за период |
| GET | `/analytics/campaigns-summary` | Сводка по кампаниям за период |
| GET | `/analytics/daily-summary` | Динамика по дням |
| GET | `/analytics/recent-replies` | Последние ответы |
| GET | `/analytics/campaign-sequence` | Sequence сообщений в кампании |
| GET | `/analytics/template-conversions` | Конверсия шаблонов |
| GET | `/analytics/ai-insights` | AI-инсайт от Gemini |
| GET | `/crm/leads` | Список лидов с фильтрами |
| GET | `/crm/leads/{id}` | Карточка лида |
| GET | `/crm/leads/{id}/activities` | История активности лида |
| POST | `/sync-all` | Ручной запуск синхронизации |

Полная документация Swagger: `/docs` на Railway URL.
