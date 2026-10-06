# BeForth CRM — lead management prototype

React UI (`src/`, befui components) + Django API (`backend/`). Leads arrive from the website, Meta Ads and Google Ads, land in one inbox, then get verified, assigned and followed up.

## Run
```bash
# API  (http://127.0.0.1:8100)
cd backend && python3 -m venv .venv && .venv/bin/pip install django
.venv/bin/python manage.py migrate && .venv/bin/python manage.py seed
.venv/bin/python manage.py runserver 8100

# UI   (http://localhost:3000, proxies /api to :8100)
npm install && npm run dev
```
Demo logins (password `demo1234`): `neha` (admin), `vikram` (manager), `amit` / `sneha` / `rohan` / `pooja` (sales).
`manage.py seed` resets everything to 30 demo leads (admin also has a "Reset demo" button).

## Connect ad accounts (Meta Ads, Google Ads)
Admin → **Integrations → Advertising platforms → Connect**. The user signs in on Meta's/Google's own page; the CRM stores the connection (tokens encrypted) and imports leads automatically (Meta instantly via webhook, both via `manage.py sync_ads --loop 300`).
Full explanation, developer setup, App Review / developer-token requirements, testing and production checklist: **[docs/ad-connections.md](docs/ad-connections.md)**.
Try it without real credentials (demo mode): start the API with `AD_PLATFORMS_MOCK=1 AD_SYNC_INTERVAL=60 PUBLIC_BASE_URL=http://localhost:3100`. You get a fake consent page, demo accounts, and on each connected card a **Simulate incoming lead** button and a **Live demo** switch (a new lead every 15 s). `AD_SYNC_INTERVAL` makes the API pull leads from connected accounts on its own every N seconds. Tests: `cd backend && .venv/bin/python manage.py test leads`.

## Lead ingestion: webhooks created in the CRM
Admin → **Integrations → New webhook** (Website form, Meta Ads or Google Ads). Each webhook gets its own URL `/api/hooks/<token>`, a secret (Meta verify token / Google key), a step-by-step setup guide with the real values filled in, a **Send test lead** button, pause/rotate/delete, and a delivery log (including failed requests).
All sources create the same lead, run the duplicate check and notify the team.

| Kind | What it accepts |
|---|---|
| Website | `POST` JSON or form post: `name`, `phone`/`email`, `company`, `location`, `requirement`, `campaign`/`utm_campaign`. Honeypot field `hp`. |
| Meta Ads | `GET` = Meta's subscribe handshake (verify token = webhook secret), `POST` = `leadgen` event; details fetched from the Graph API. |
| Google Ads | `POST` lead-form payload; `google_key` must equal the webhook secret. |

Server environment (Meta only): `META_PAGE_TOKEN` (fetch lead details), `META_APP_SECRET` (verify signatures). The CRM must be reachable on a public HTTPS address for Meta and Google; set it on the Integrations page so URLs and guides show your domain.

## Not done yet (needs client decisions)
Postgres/MySQL (SQLite now), HTTPS + real secrets, rate limiting on the public endpoints, notification channels (email/WhatsApp), per-user passwords reset, automatic assignment rules.
