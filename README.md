# LinkedIn Outreach Analytics Platform

A web application for analyzing LinkedIn outreach campaigns powered by [MeetAlfred](https://meetalfred.com/). It tracks campaigns, leads, replies, and messages, visualizes funnels, and generates AI-driven insights.

**Live demo:** https://sales-analytics-project.vercel.app/
Log in as **Guest** to see all dashboards with anonymized data (lead names, companies, and message texts are hidden).

---

## Features

- **Main dashboard** — aggregated analytics for invites/replies/connections, daily trends, and period-over-period comparison
- **Campaigns** — detailed analytics for each campaign, message sequences, and template conversion rates
- **CRM** — full list of leads with filters (name, company, location, status, activity period), lead detail card with activity history and messaging
- **Message analytics** — statistics on templates, replies, and custom messages
- **World map** — geographic distribution of leads
- **AI insights** — Google Gemini analyzes data for the selected period and provides recommendations
- **Demo mode** — public guest access with full PII anonymization (personal names, companies, and message texts are blurred)

---

## Tech stack

### Backend
- **Python** + **FastAPI** — REST API
- **SQLAlchemy** — ORM
- **PostgreSQL** — database
- **Pydantic** — validation
- **APScheduler** — background data sync
- **httpx** — client for the MeetAlfred API
- **Google Gemini API** — AI insights generation

### Frontend
- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** — styling
- **Recharts** — charts
- **react-simple-maps** + **D3** — interactive world map
- **Framer Motion** — animations
- **Axios** — HTTP client

### Infrastructure
- **Railway** — backend + PostgreSQL hosting
- **Vercel** — frontend hosting (auto-deploy from `main`)
- **GitHub** — version control and CI/CD

---

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│ Next.js (Vercel)│ ◄─────► │ FastAPI (Railway)│ ◄─────► │   PostgreSQL    │
│                 │  HTTPS  │                  │   SQL   │   (Railway)     │
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

## Project structure

```
sales_project/
├── backend/                    # FastAPI application
│   ├── main.py                 # Entry point, routes
│   ├── models.py               # SQLAlchemy models
│   ├── database.py             # DB connection
│   ├── analytics.py            # Analytics business logic
│   ├── crm.py                  # CRM logic (leads, activities)
│   ├── scheduler.py            # APScheduler background jobs
│   ├── services/
│   │   ├── meetalfred_client.py  # MeetAlfred integration
│   │   └── ai_service.py         # Gemini integration
│   ├── requirements.txt
│   ├── Procfile                # Start command for Railway
│   └── .env.example
│
├── frontend-clean/             # Next.js application
│   ├── app/
│   │   ├── page.tsx            # Main dashboard
│   │   ├── layout.tsx          # Root layout
│   │   ├── login/              # Login page (Guest/Admin)
│   │   ├── crm/                # CRM with leads
│   │   ├── campaigns/          # Campaign and message analytics
│   │   ├── leads/              # Lead analytics
│   │   ├── settings/           # In-app guide
│   │   ├── components/         # Header, Sidebar, charts
│   │   ├── lib/
│   │   │   ├── AuthContext.tsx # Authentication (Guest/Admin)
│   │   │   ├── demo.ts         # Demo mode and anonymization logic
│   │   │   └── DemoMessage.tsx # Text blurring in demo mode
│   │   └── api/client.ts       # Axios instance
│   ├── package.json
│   ├── next.config.mjs         # CSP headers, config
│   └── .env.example
│
└── README.md
```

---

## Local setup

### Requirements
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

Create a `backend/.env` file (see `.env.example`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/meetalfred_db
GEMINI_API_KEY=your_gemini_api_key
```

Run:

```bash
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`. API docs: `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend-clean
npm install
```

Create a `frontend-clean/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
```

Run:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## Deployment

### Backend (Railway)
1. Create a project from the GitHub repository
2. Settings → Source → Root Directory: `backend`
3. Add the PostgreSQL plugin
4. Variables:
   - `DATABASE_URL` (auto-injected by the PostgreSQL plugin)
   - `GEMINI_API_KEY`

### Frontend (Vercel)
1. Import the Git repository
2. Root Directory: `frontend-clean`
3. Environment Variables:
   - `NEXT_PUBLIC_API_URL` — backend URL on Railway
   - `NEXT_PUBLIC_ADMIN_PASSWORD` — admin password

---

## Authentication

- **Guest** — public demo access, all data is anonymized
- **Admin** — full access via the password defined in `NEXT_PUBLIC_ADMIN_PASSWORD`

The logic lives in `app/lib/AuthContext.tsx`; the `DEMO_MODE` flag in `app/lib/demo.ts` controls the level of anonymization.

---

## Main API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/profiles-summary` | Profile summary for a period |
| GET | `/analytics/campaigns-summary` | Campaign summary for a period |
| GET | `/analytics/daily-summary` | Daily trends |
| GET | `/analytics/recent-replies` | Recent replies |
| GET | `/analytics/campaign-sequence` | Message sequence in a campaign |
| GET | `/analytics/template-conversions` | Template conversion rates |
| GET | `/analytics/ai-insights` | AI insight from Gemini |
| GET | `/crm/leads` | List of leads with filters |
| GET | `/crm/leads/{id}` | Lead detail |
| GET | `/crm/leads/{id}/activities` | Lead activity history |
| POST | `/sync-all` | Manual sync trigger |

Full Swagger docs: `/docs` on the Railway URL.
