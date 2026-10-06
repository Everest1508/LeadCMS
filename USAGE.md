# How to use the BeForth CRM prototype

A CRM that collects leads from your **website**, **Meta Ads** and **Google Ads** into one inbox, then lets your team verify, assign, follow up and track them to Won/Lost.

---

## 1. Start it (first time)

You need **Node 20+** and **Python 3.11+**.

```bash
# Terminal 1: the API (Django)
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed            # loads users + 30 demo leads

# Demo mode = fake Meta/Google sign-in, demo accounts, demo buttons.
AD_PLATFORMS_MOCK=1 AD_SYNC_INTERVAL=60 PUBLIC_BASE_URL=http://localhost:3000 \
  .venv/bin/python manage.py runserver 8100

# Terminal 2: the screens (React)
npm install
npm run dev                                # opens on http://localhost:3000
```

Open **http://localhost:3000**.

> Leave out `AD_PLATFORMS_MOCK=1` when you use real Meta/Google accounts (see section 6).

## 2. Sign in

Pick a user, password is **`demo1234`**.

| User | Role | Can do |
|---|---|---|
| `neha` | Administrator | everything, plus Integrations and Lead Sources |
| `vikram` | Sales Manager | see all leads, verify, assign, reports |
| `amit`, `sneha`, `rohan`, `pooja` | Salesperson | only their assigned leads: verify, notes, calls, follow-ups, move through the pipeline |

## 3. The daily workflow

1. **Dashboard**: totals, leads by source, today's / overdue / upcoming follow-ups, pipeline summary, salesperson performance.
2. **Lead Inbox**: every lead from every source. Search by name, company, phone, email or lead ID (press `/`). Filter by source, status, salesperson, priority, score and date. Leads that need checking show a **Verify** button.
3. **Open a lead**:
   - **Verification tab**: tick the 5 checks (phone, email, company, requirement, duplicate), choose **Genuine / Not Genuine / Need More Information**, save.
     - *Genuine* needs all 5 ticks and moves the lead to **Verified**.
     - *Not Genuine* keeps the lead but moves it to **Lost**.
   - **Assign** (managers/admins): choose a salesperson and priority (Hot/Warm/Cold). Only possible after Genuine.
   - **Activity timeline tab**: record a Call, Email, Meeting, WhatsApp, Note or **Follow-up** (with date and time). Every action is also written to the history automatically.
   - A yellow **"Possible duplicate lead found"** banner appears if the phone, email or company matches another lead.
4. **Sales Pipeline**: drag cards between columns (New → Verified → Contacted → Qualified → Meeting → Proposal → Negotiation → Won / Lost) or use the arrow on a card. A lead can't go past New until it is verified Genuine.
5. **Reports**: leads by source, by status, by salesperson, genuine vs not genuine, conversion rate, pipeline value, follow-up report. Filter by date, export CSV.
6. **Bell icon**: new lead, assigned, verification pending, connection problems.

## 4. Connect your lead sources (admin only)

Go to **Integrations**.

### Meta Ads and Google Ads: click Connect
1. Click **Connect Meta Ads** (or **Google Ads**).
2. Sign in on Meta's / Google's own page and choose what to share. The CRM never sees your password.
3. Done. The card shows the business, ad account, who connected, when access ends and last sync. New leads now arrive by themselves:
   - **Meta**: within seconds (needs a public HTTPS address in production).
   - **Google**: every few minutes by a background job.
4. If access expires or is removed, the card turns red with a **Reconnect** button.
5. **Disconnect** stops it and deletes the saved keys.

### Website form: create a webhook
1. Under *Website forms & custom webhooks* click **New webhook**.
2. Choose **Website form**, give it a name, click **Create and show steps**.
3. Follow the 3 steps: copy the link, paste the ready-made form into your page (or paste the link into your form tool's "Webhook" setting), click **Send test lead**.
4. Not a developer? Click **Copy instructions** and send it to whoever manages the website.
5. The **Deliveries** tab shows every request received, including failed ones.

## 5. Demo to a client (3 minutes)

In demo mode:
1. Sign in as `neha` → **Integrations** → **Connect Meta Ads** → **Allow** (fake sign-in page).
2. On the connected card, open **Demo tools**: click **Simulate incoming lead**, or switch on **Live demo** (a new lead every 15 s).
3. Open the **Dashboard** in another tab and watch the counts and notifications update.
4. Sign in as `vikram`: open a new lead, verify as **Genuine**, assign it to Amit.
5. Sign in as `amit`: add a call and a follow-up, move the lead along the pipeline to **Won**.
6. Back on the dashboard: Won count and conversion rate have changed.
7. As `neha`, click **Disconnect** to show credentials being removed.

Admins can click **Reset demo** (top bar) to restore the 30 starting leads.

## 6. Use real Meta / Google accounts

Short version: you need a Meta developer app, a Google Cloud project + Google Ads developer token, approval from both, and a public HTTPS address. Everything is explained step by step in **[docs/ad-connections.md](docs/ad-connections.md)**. On the Integrations page, **Developer setup** shows the same steps with your redirect address filled in.

Settings go in environment variables (never in code):

| Variable | What |
|---|---|
| `PUBLIC_BASE_URL`, `FRONTEND_URL` | your public address, e.g. `https://crm.yourcompany.com` |
| `CRM_ENCRYPTION_KEY` | key that encrypts saved tokens. Generate: `python -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())"` |
| `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` | from your Meta app |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_DEVELOPER_TOKEN` | from Google Cloud / Google Ads API Center |
| `DB_ENGINE=postgres` + `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` | use PostgreSQL instead of the default SQLite |
| `AD_SYNC_INTERVAL` | seconds between automatic Google/Meta checks when run with `runserver` (in production run `manage.py sync_ads --loop 300` as its own process) |

## 7. Check it works

```bash
cd backend && .venv/bin/python manage.py test leads   # 12 tests
npx tsc --noEmit                                       # types
npm run build                                          # production build of the screens
```

## 8. Where things are

| Path | What |
|---|---|
| `src/pages/` | screens: dashboard, inbox, lead, pipeline, reports, integrations |
| `src/components/ui/` | befui components |
| `src/store.tsx`, `src/api.ts` | how the screens talk to the API |
| `backend/leads/` | models, API, webhooks, ad-platform adapters (`platforms/`) |
| `backend/leads/seed.json` | the demo data |
| `docs/ad-connections.md` | full Meta/Google connection guide |

## 9. Not done yet

Email/WhatsApp notifications, automatic lead assignment, multiple customers (multi-tenant), ad performance reports, rate limiting on public endpoints, and production deployment (HTTPS, PostgreSQL, process manager). These depend on client answers (see "Open Questions" in the original spec).
