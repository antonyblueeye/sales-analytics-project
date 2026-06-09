# Network Egress Audit Report

**Дата:** 2026-06-09  
**Стек:** FastAPI + PostgreSQL (backend/Railway), Next.js 14 (frontend/Vercel)  
**Проблема:** ~61 GB Network Egress на Railway за короткий период

---

## Executive Summary

Наиболее вероятный источник **61 GB egress — не фронтенд-дашборд**, а **фоновая синхронизация с MeetAlfred API** (`scheduler.py` → `meetalfred_client.py`), которая каждый час полностью скачивала всю историю actions по 4 типам для каждого профиля.

Второй по значимости источник — **тяжёлые CRM-ответы** с полными текстами переписок в списках лидов, усугублённые **тройным fetch** на странице CRM.

---

## Оценка источников трафика (61 GB)

### 🔴 Критический: MeetAlfred Sync (≈85–95% egress)

| Параметр | Значение |
|----------|----------|
| Частота | Каждые **60 мин** (APScheduler) |
| Что скачивается | `new-leads` + 4× `get-last-actions` (invites, accepted, messages, replies) |
| Пагинация | 100 записей/страница, **вся история** без early-stop |
| Профили | × N профилей в БД |

**Пример расчёта (1 профиль, умеренная активность):**

```
10 000 actions × 4 типа = 40 000 записей/синх
~3 KB/запись (person + linkedin_data + message) ≈ 120 MB/синх
120 MB × 24 синх/день × 30 дней ≈ 86 GB/месяц
```

При 2 профилях или большем объёме данных — **61 GB за 2–3 недели** объясняется полностью.

**Частота вызовов HTTP API (до исправлений):** 720 sync-циклов/месяц × 5 endpoint-циклов × ~100+ страниц = **сотни тысяч исходящих HTTP-запросов к MeetAlfred**.

### 🟠 Высокий: CRM list endpoints (≈5–10% egress)

| Endpoint | Размер ответа | Частота | Проблема |
|----------|---------------|---------|----------|
| `GET /crm/replied-leads` | **100–500 KB** | Каждый визит CRM | 20 лидов × полная переписка |
| `GET /crm/leads` | **50–300 KB** | Каждый визит CRM | То же |
| ×3 дублирующих fetch | ×3 | На каждый mount CRM | Bug в `useEffect` |

**До исправлений:** 1 визит CRM ≈ 3 × 200 KB = **600 KB** только на список.

### 🟡 Средний: Dashboard analytics (≈3–5% egress)

| Endpoint | Размер | Частота |
|----------|--------|---------|
| `/analytics/recent-replies` | 150–400 KB (200 записей + full message) | Каждая смена даты |
| `/analytics/campaign-sequence` | 80–200 KB | Messages Analytics tab |
| `/analytics/template-conversions` | 80–150 KB | Conversions tab |
| Dashboard mount burst | ~10 запросов | Каждый визит `/` |

Polling **не обнаружен** — данные не перезапрашиваются автоматически.

### 🟢 Низкий: прочее

- `/analytics/campaigns-list` — дублируется в 5 компонентах (~2 KB), без кэша
- `/profiles` — отдавал `api_key` в JSON (security + лишние байты)
- Gzip **не был включён** — JSON-сжатие 70–85% не использовалось
- `setInterval` в DashboardCharts — **только UI-карусель**, без HTTP

---

## API Endpoints: ответы >100 KB

| Endpoint | Тип данных | >100 KB? | Причина |
|----------|------------|----------|---------|
| `/crm/replied-leads` | Сырые messages | ✅ | Вся переписка 20 лидов |
| `/crm/leads` | Сырые messages | ✅ | То же (теперь opt-in) |
| `/analytics/recent-replies` | 200 full messages | ✅ | Было 200, стало 50 + truncate |
| `/analytics/campaign-sequence` | Full template text ×100 | ✅ | Кэш 5 мин (было) |
| `/analytics/template-conversions` | 50 templates + text | ✅ | Агрегировано, но тяжёлое |
| `/actions?limit=100` | Raw ORM + message | ⚠️ | Dev/debug endpoint |
| `/analytics/funnel-history` | All-time buckets | ⚠️ | Растёт с годами данных |
| Остальные analytics | Агрегированные | ❌ | Обычно <50 KB |

**Графики дашборда:** все используют **агрегированные** данные (profiles-summary, campaigns-summary, daily-summary, funnel-history). Сырые записи — только CRM и recent-replies carousel.

---

## Frontend: паттерны загрузки

| Паттерн | Статус |
|---------|--------|
| React Query / SWR | ❌ Не используется |
| Polling / refetchInterval | ❌ Не найдено |
| setInterval + fetch | ❌ Не найдено |
| CRM triple-fetch | ✅ **Исправлено** |
| Dashboard mount burst (~10 req) | ⚠️ By design, без polling |
| `/campaigns-list` ×5 без кэша | ⚠️ Backend cache добавлен |

---

## Внесённые изменения

### Backend

1. **`GZipMiddleware`** — сжатие JSON-ответов >1 KB (`main.py`)
2. **Лимиты pagination:** CRM max 100, actions max 500, search max 50
3. **CRM без messages по умолчанию** — `include_messages=false`; списки не тянут переписку
4. **Truncate messages** до 500 символов в detail/activities endpoints
5. **`/profiles`** — только `{id, name}`, без `api_key`
6. **Кэш 5 мин:** `campaigns-list`, `funnel-history` + HTTP `Cache-Control` для campaigns-list
7. **`recent-replies`:** limit 200 → **50**, truncate message
8. **MeetAlfred incremental sync:** early-stop после 2 страниц подряд с известными записями
9. **Scheduler:** интервал 60 мин → **360 мин** (6 ч), настраивается через `SYNC_INTERVAL_MINUTES`
10. **Backup в scheduler отключён по умолчанию** на Railway (`ENABLE_SCHEDULED_BACKUP=false`)

### Frontend

1. **CRM:** объединены 3 `useEffect` → 1 fetch на изменение фильтров/таба
2. **CRM:** убрана зависимость от `messages` в списке (используются `profileNames`)
3. **DashboardCharts:** carousel recent-replies slice 200 → 50

---

## Рекомендации (дополнительно)

| Приоритет | Действие | Ожидаемый эффект |
|-----------|----------|------------------|
| 🔴 | Задеплоить изменения на Railway | −80–90% egress от sync |
| 🔴 | Установить `SYNC_INTERVAL_MINUTES=360` (или 720) в Railway env | Контроль частоты sync |
| 🟠 | Добавить auth на `/sync-*` и CRM write endpoints | Защита от ботов/сканеров |
| 🟠 | React Query с `staleTime: 5min` для `campaigns-list` / `profiles` | −重复 запросы между страницами |
| 🟡 | Date bounds на `funnel-history` / `campaign-history` | Меньше JSON со временем |
| 🟡 | Lazy-load messages при открытии drawer (`GET /crm/leads/{id}`) | Ещё −50% CRM egress при include_messages |
| 🟢 | Railway metrics: разделить egress by destination | Подтвердить MeetAlfred vs clients |

---

## Ожидаемое снижение egress после деплоя

| Источник | Было (оценка) | После | Снижение |
|----------|---------------|-------|----------|
| MeetAlfred sync | ~50–55 GB/мес | ~2–5 GB/мес | **−90%** |
| CRM lists | ~3–5 GB/мес | ~0.3–0.5 GB/мес | **−85%** |
| Dashboard | ~1–2 GB/мес | ~0.5–1 GB/мес | **−40%** |
| Gzip (все ответы) | — | — | **−70%** на JSON |

**Итого:** с ~61 GB/мес до **~3–7 GB/мес** при типичном использовании.

---

## Railway env variables

```env
SYNC_INTERVAL_MINUTES=360
ENABLE_SCHEDULED_BACKUP=false
```

Для ручного бэкапа локально: `python backup_db.py` (как в PROJECT_GUIDE.md).

---

## Файлы изменений

- `backend/main.py` — gzip, limits, safe profiles, cache headers
- `backend/crm.py` — include_messages, truncate, lightweight replied-leads
- `backend/analytics.py` — cache helpers, recent-replies limit, funnel cache
- `backend/services/meetalfred_client.py` — incremental pagination early-stop
- `backend/scheduler.py` — configurable interval, optional backup
- `frontend-clean/app/crm/page.tsx` — single-fetch pattern
- `frontend-clean/app/components/charts/DashboardCharts.tsx` — recent replies limit
