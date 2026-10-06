# Connecting Meta Ads and Google Ads

How the CRM connects to a customer's advertising accounts, and how leads then arrive on their own.
Terms are explained where they first appear. Items marked **[approval]** need approval from Meta or Google before real customers can use them.

> I checked the Meta and Google developer docs while building this, but both change often (API versions, scope names, review rules).
> Treat versions and review details as "confirm in the dashboard" before launch. Versions are settings, not code: `META_GRAPH_VERSION`, `GOOGLE_ADS_API_VERSION`.

---

## 1. Architecture

```
 Browser (React)                Django backend                          Meta / Google
 ───────────────                ──────────────                          ─────────────
 Integrations page  ──start──▶  /api/connections/<platform>/start
        │                         builds signed `state`, returns the
        │◀── login URL ───────    platform's official login URL
        │
        └──── redirect ─────────────────────────────────────────────▶  Login + consent screen
                                                                        (user picks Pages / ad accounts)
        ┌──── redirect back  ?code=…&state=… ◀──────────────────────── 
        ▼
                              /api/connections/<platform>/callback
                                1. verify `state`
                                2. exchange `code` for tokens  ───────▶  token endpoint
                                3. look up accounts/pages     ───────▶  Graph API / Google Ads API
                                4. save AdConnection (tokens encrypted)
                                5. first lead import
        ◀── redirect to #/integrations?connected=meta

 Afterwards (no user involved):
   Meta   webhook  ──▶ /api/meta/webhook  ──▶ fetch lead with Page token ──▶ Lead Inbox   (instant)
   Both   `manage.py sync_ads --loop 300` polls each connection             ──▶ Lead Inbox   (backstop)
   Website form ──▶ /api/hooks/<token>  (Integrations → webhooks)                              (instant)
```

**One adapter per platform, one shared shape.** `leads/platforms/meta.py` and `google.py` both expose
`configured() · authorize_url() · connect() · refresh_status() · select() · disconnect() · sync()`.
The views (`connect_views.py`), the sync job and the React page only talk to that shape, so adding LinkedIn or TikTok later means adding one file.
The frontend never sees a token or a platform-specific field.

Terms:
- **OAuth 2.0**: the standard way for a user to let your app act on their account without giving you their password. The user logs in on Meta's/Google's own page and approves a list of permissions.
- **Authorization code**: a one-time code the platform sends back to your server after approval. Your server swaps it for tokens (this swap needs your app secret, which is why it must happen on the backend).
- **Access token**: the key used on every API call. Short-lived.
- **Refresh token**: (Google) a long-lived key used only to get new access tokens.
- **Scope / permission**: one item on the consent screen, e.g. "read your lead forms".
- **`state`**: a random value we sign and send out, and check when the user returns. It stops forged callbacks (CSRF).

---

## 2. User connection flow

1. Admin opens **Integrations → Advertising platforms** and clicks **Connect Meta Ads**.
2. Browser goes to Meta's login. If already logged in to Facebook they only see the consent screen.
3. **What they see on Meta:** "BeForth CRM wants to access…" with the permissions listed, and a step to choose **which Businesses, Pages and ad accounts** to share. Only what they tick is accessible.
4. They click Continue. Meta redirects to our callback. The CRM saves the connection and imports leads.
5. The card now shows: ✓ Connected, Business, Ad account, who connected, when access ends, last sync, and which Pages we listen to.

Google is the same with Google's account chooser and a consent screen listing "Manage your Google Ads campaigns" (the `adwords` scope).

If the user clicks Cancel the platform returns `?error=access_denied`; we show the message and store nothing.

---

## 3. Meta connection

### Create the Meta app (done once by you, not by customers)
1. developers.facebook.com → **My Apps → Create app**, type **Business**, linked to your Meta Business portfolio.
2. Add products: **Facebook Login** (or **Facebook Login for Business**, which saves a permission set as a "configuration"; set `META_LOGIN_CONFIG_ID` to use it) and **Webhooks**.
3. Facebook Login → Settings: **Valid OAuth Redirect URIs** = `https://<your-domain>/api/connections/meta/callback`. Set the **Deauthorize callback** to `…/api/meta/deauthorize`.
4. Webhooks → **Page** → callback `…/api/meta/webhook`, verify token = `META_VERIFY_TOKEN`, subscribe to field **`leadgen`**.
5. Settings → Basic: copy App ID and App Secret into `META_APP_ID`, `META_APP_SECRET`. Add a privacy-policy URL and a data-deletion URL/callback here (needed for review).

### Permissions (scopes) requested
| Scope | Why |
|---|---|
| `leads_retrieval` | read lead form submissions |
| `pages_show_list` | list the Pages the user manages |
| `pages_read_engagement` | required by Meta alongside lead retrieval |
| `pages_manage_metadata` | subscribe a Page to the `leadgen` webhook |
| `ads_read` | list ad accounts, campaigns, performance (read only) |
| `business_management` | see which Business owns the ad account |

Meta's lead-retrieval docs also list `ads_management` (needed for ad-level detail on a lead). We use read-only `ads_read` because we are not managing ads; add `ads_management` via `META_SCOPES` only if Meta rejects a call. Each extra permission is extra review work.

### What the backend receives, step by step
1. Callback: `?code=…&state=…`.
2. `GET /oauth/access_token` with code + app secret → **short-lived user token** (about 1–2 hours).
3. Same endpoint with `grant_type=fb_exchange_token` → **long-lived user token** (about **60 days**).
4. `GET /debug_token` → is it valid, which scopes were really granted, `expires_at`, `data_access_expires_at`.
5. `GET /me/accounts` → the user's Pages, each with its own **Page access token**. Page tokens obtained from a long-lived user token do not expire on a timer (they stop working if the user removes the app, changes password, or loses their Page role).
6. `GET /me/adaccounts?fields=account_id,name,business{id,name}` → this is how we know the **ad account and Business** (shown as "Business: ABC Company / Ad Account: …").
7. `POST /{page-id}/subscribed_apps?subscribed_fields=leadgen` for each chosen Page.

### Token lifetime, refresh, re-authorization
- Meta has **no refresh token**. Before the 60 days end the user must go through Connect again ("re-authorize"). The CRM shows **Expiring soon** 7 days ahead and **Expired** after.
- Separately, Meta limits how long an app may read a user's data without them returning (**data access expiry**, about 90 days). `Check connection` refreshes this view from `debug_token`.
- Plan for a reminder email/notification at 14 days. (A notification is created when a sync fails; an expiry reminder is a small addition.)

### Expired or revoked
Meta signals a bad token with error **code 190** (subcodes: 463 expired, 460 password changed, 458/459 app removed). `http.py` maps these to `auth` or `revoked`; `sync.py` stores status `expired`/`revoked`, keeps the message, creates a notification, and **stops calling** until the admin reconnects. If the user removes the app in Facebook settings, Meta also calls `/api/meta/deauthorize` and we mark it revoked immediately.

### Disconnect
Unsubscribes each Page from `leadgen`, calls `DELETE /me/permissions` (removes our app's access for that user), then deletes every stored token and detail from the database. The row stays (status `disconnected`) for audit.

### App Review and verification **[approval]**
- **Development mode** (default): only people with a role on the app (Admin/Developer/Tester) can connect, and no review is needed. Use this to build and test.
- To serve **other businesses** you need: **Business Verification** of your company, **App Review** for **Advanced Access** on each permission above (privacy-policy URL, a screencast showing exactly how each permission is used, test login/instructions, data-deletion mechanism), and then switch the app to **Live**.
- Apps that access other businesses' assets on their behalf may also need to complete **Tech Provider** onboarding. I could not confirm the current exact requirement; check Meta's "Tech Provider" page.
- Review typically takes days to weeks and is often rejected once for unclear screencasts. Start early.

### Test with a real Meta Business account
1. Create the app (Development mode) and add your own Facebook account as app Admin.
2. You need a Facebook **Page** and a **Lead Ads form** on it (Meta Business Suite → Instant forms), and an ad account.
3. Expose your local backend with HTTPS (e.g. `ngrok http 8100`), set `PUBLIC_BASE_URL` to that address, register the redirect URI and webhook with the same address.
4. Click Connect. Then use Meta's **Lead Ads Testing Tool** (developers.facebook.com/tools/lead-ads-testing) to submit a test lead for your Page. It should appear in the CRM within seconds.
5. Also test: Cancel on the consent screen, removing the app in Facebook → Settings → Business Integrations, and Disconnect.

---

## 4. Google Ads connection

### Set up (done once by you)
1. **Google Cloud project**: console.cloud.google.com → new project → enable **Google Ads API**.
2. **OAuth consent screen** (APIs & Services → OAuth consent screen / Google Auth Platform): User type **External**, app name, support email, logo, privacy-policy URL, authorised domain. Add scope `https://www.googleapis.com/auth/adwords`.
   - **Testing** status: only listed test users can connect, and **refresh tokens expire after 7 days**. Fine for development.
   - **Production** status: refresh tokens last until revoked, but see verification below.
3. **OAuth client**: Credentials → Create → OAuth client ID → *Web application*; authorised redirect URI `https://<your-domain>/api/connections/google/callback`. Copy `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
4. **Developer token**: sign in to a Google Ads **manager account** (create one free at ads.google.com/home/tools/manager-accounts) → Tools → **API Center** → apply. The token identifies *your app* to the API and goes in a header on every call (`GOOGLE_DEVELOPER_TOKEN`). New tokens have **test-account access only**; you must apply for **Basic access** (Google reviews your use case) before it works on real customers' accounts **[approval]**.

### Scopes
Only `https://www.googleapis.com/auth/adwords` for Google Ads (plus `openid email` so we can show which Google user connected).

### What the user sees and does
Click **Connect Google Ads** → Google's account chooser → consent screen (in Testing mode it shows an "unverified app" warning) → Allow → back in the CRM.
We ask for `access_type=offline` and `prompt=consent`, which is what makes Google return a **refresh token**. (Without those, you get an access token only and the connection dies in an hour.) If Google returns no refresh token, the CRM tells the user to remove the app at myaccount.google.com/permissions and connect again.

### What the backend receives and how it identifies the account
1. Callback `?code=…&state=…` → `POST oauth2.googleapis.com/token` → **access token** (about 1 hour) + **refresh token** (long-lived).
2. `GET …/customers:listAccessibleCustomers` (with `developer-token` header) → the **customer IDs** the user can reach. A **customer ID** is the 10-digit Google Ads account number (shown as 123-456-7890).
3. For each, a small query (`SELECT customer.id, customer.descriptive_name, customer.manager …`) gives the name and whether it's a **manager (MCC) account**. Manager accounts contain other accounts and can't hold lead forms themselves, so we pick the first non-manager account by default and let the admin choose another in the card. If you reach clients through a manager, set `GOOGLE_LOGIN_CUSTOMER_ID` (sent as the `login-customer-id` header).

### Tokens: how they work
- Access token: expires in about an hour. `ensure_token()` quietly mints a new one from the refresh token whenever it is within 2 minutes of expiry.
- Refresh token: stored encrypted; used only server-side. It stops working if the user revokes access, if it hasn't been used for about 6 months, if the consent screen is in **Testing** (7 days), or if the account exceeds Google's per-client limit on refresh tokens.
- When refresh fails with `invalid_grant`, the connection becomes **Access removed** and the admin sees **Reconnect**.

### Disconnect
Calls Google's revoke endpoint with the refresh token, then deletes all stored tokens and details.

### Before real customers can use it **[approval]**
1. **Developer token Basic access** approved by Google (above).
2. **OAuth app verification**: `adwords` is a *sensitive* scope, so Google must verify your app (brand check, privacy policy and terms on your domain, a demo video of the consent flow and how data is used). Until verified, users see an "unverified app" screen and are capped at 100 users.
3. Move the consent screen from Testing to **Production**.

### Test
1. Start with a **test manager account + test Google Ads account** (the developer token works on those immediately, no approval).
2. Add your Google account under OAuth consent screen → **Test users**.
3. Connect, confirm the customer ID shows, then create a **Lead form asset** on a campaign in the test account and submit it (Google's "Send test data" does not create stored submissions; real submissions in a test account may be limited, so also try a small real campaign). Run `Sync now`.
4. Test Cancel, revoking at myaccount.google.com/permissions, and Disconnect.

---

## 5. Database design

`AdConnection` (PostgreSQL; set `DB_ENGINE=postgres`). One row per platform in this single-tenant build. For many customers add an `organization` foreign key and change `unique(platform)` to `unique(organization, platform)`.

| Column | Meaning |
|---|---|
| `platform` | `meta` / `google` |
| `external_id`, `account_name` | selected Meta ad account id / Google customer id and its name |
| `business_id`, `business_name` | Meta Business that owns the ad account |
| `access_token_enc`, `refresh_token_enc` | **encrypted** (Fernet). Never returned by any API |
| `token_expires_at` | when the access token / long-lived token ends (null = no expiry) |
| `scopes` | permissions actually granted (from `debug_token` / the token response) |
| `details` (JSON) | Meta: user, ad accounts, Pages (each Page token encrypted, `listening` flag). Google: login email, accessible customers |
| `connected_by` | CRM user who clicked Connect |
| `status` | `active` · `expiring` · `expired` · `revoked` · `error` · `disconnected` |
| `error_message` | last failure, human readable |
| `created_at`, `updated_at`, `last_sync_at`, `last_sync_count` | audit + sync health |

`Lead.external_id` (indexed) holds the platform's lead id (`meta:<id>`, `google:<customer>:<id>`). A lead is imported only if that id is new, so polling, webhooks and "Sync now" can all overlap safely.

---

## 6. Backend API

| Endpoint | Purpose |
|---|---|
| `GET  /api/connections` | admin: connections + which platforms are configured |
| `POST /api/connections/<platform>/start` | returns the official login URL (with signed `state`) |
| `GET  /api/connections/<platform>/callback` | OAuth return: verifies state, stores connection, redirects to the UI |
| `POST /api/connections/<id>/select` | choose ad account / customer; (Meta) choose Pages to listen to |
| `POST /api/connections/<id>/sync` | import leads now |
| `POST /api/connections/<id>/recheck` | re-validate access, update expiry/status |
| `POST /api/connections/<id>/disconnect` | revoke at the provider and wipe credentials |
| `GET/POST /api/meta/webhook` | Meta's app-level webhook (handshake + instant `leadgen` events, signature checked) |
| `POST /api/meta/deauthorize` | Meta tells us a user removed the app |
| `manage.py sync_ads [--loop N]` | scheduled import for both platforms |

All admin-only except the provider-facing ones.

## 7. Frontend flow

`Integrations` → `AdPlatforms` cards (`src/pages/platforms.tsx`). Connect calls `start`, then `window.location = url`. After the provider returns, the backend redirects to `#/integrations?connected=meta`; the page shows a toast and the store (polling every 8 s) already has the new connection and leads. States: *not configured* (shows developer setup steps), *not connected*, *connected*, *expiring*, *expired/revoked* (red banner + Reconnect). The page is plain React; with Next.js the same calls work unchanged.

## 8. Security requirements

- **Tokens encrypted at rest** (Fernet). Set `CRM_ENCRYPTION_KEY` (comma-separated keys allow rotation: the first encrypts, all decrypt). Keep it outside the database and out of git.
- **Never send tokens to the browser or logs.** The connection JSON has no token fields; HTTP errors are reduced to the provider's message.
- **`state` is signed and expires in 10 minutes**; callback also checks it matches the platform.
- **HTTPS everywhere** in production; the redirect URIs must be HTTPS.
- **Webhooks:** Meta's `X-Hub-Signature-256` is verified with the app secret; handshake uses a verify token; per-webhook URLs are unguessable.
- **Least privilege:** read-only scopes only; only admins can connect/disconnect; Page subscriptions removed on disconnect.
- **Secrets in environment variables** (`META_APP_SECRET`, `GOOGLE_CLIENT_SECRET`, developer token), not code.
- **Idempotent imports**, **rate-limit** public endpoints at the proxy (not done yet), and **audit** who connected what (`connected_by`, notifications on failures).
- Handle the platforms' **data-deletion** rules: Meta requires a deletion callback/instructions URL; Google requires a privacy policy describing use of Ads data.
- Mock mode (`AD_PLATFORMS_MOCK=1`) must be off in production; the CRM shows a warning banner while it is on.

## 9. Testing process

1. **Automated** (`cd backend && .venv/bin/python manage.py test leads`): 11 tests cover connect (both platforms), encrypted storage, tampered/cancelled callbacks, admin-only access, idempotent sync, expired and revoked handling, disconnect wiping credentials, Meta webhook signature and instant import.
2. **Manual, no credentials:** run with `AD_PLATFORMS_MOCK=1` for a fake consent page, demo business/ad accounts and leads that appear on each sync.
3. **Real accounts:** follow "Test with a real … account" in sections 3 and 4. Always test the unhappy paths: cancel, revoke, expire (shorten `token_expires_at` in the DB), wrong account.

## 10. Production requirements

- PostgreSQL (`DB_ENGINE=postgres` + `DB_*`), HTTPS domain, `PUBLIC_BASE_URL`, `FRONTEND_URL`, `CRM_ENCRYPTION_KEY`, `DEBUG=False`, a real `SECRET_KEY`, `ALLOWED_HOSTS`.
- A process manager for Django and a scheduler for `sync_ads --loop 300` (systemd, cron, or Celery beat if you add Celery).
- Meta: Business Verification, App Review (Advanced Access), Live mode, privacy policy, data-deletion URL.
- Google: developer token Basic access, OAuth verification, consent screen in Production, privacy policy.
- Monitoring on `AdConnection.status` (alert when anything is not `active`) and on the sync job.
- Multi-tenant change: add `organization` to `AdConnection`, `Lead`, `Webhook` and filter every query by it.

## 11. What else the same connection can do later

The connection already holds the tokens and the selected account, so new features are new calls on the same adapter:

| Need | Meta (Graph API) | Google Ads API (GAQL) |
|---|---|---|
| Ad accounts | `/me/adaccounts` (done) | `listAccessibleCustomers` (done) |
| Campaigns | `/act_<id>/campaigns` | `SELECT campaign.id, campaign.name, campaign.status FROM campaign` |
| Ads | `/act_<id>/ads` | `… FROM ad_group_ad` |
| Lead forms | `/<page>/leadgen_forms` (done) | `… FROM asset WHERE asset.type = LEAD_FORM` |
| Leads | `/<form>/leads`, webhook (done) | `… FROM lead_form_submission_data` (done) |
| Performance | `/act_<id>/insights` (needs `ads_read`) | `SELECT metrics.clicks, metrics.cost_micros, metrics.conversions … FROM campaign` |

Because leads already carry `campaign` and `external_id`, joining lead outcomes (Won/Lost) with ad spend to get cost per won deal is the natural next report.
