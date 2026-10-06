"""Advertising platform connections: OAuth start/callback, account selection, disconnect, sync, Meta app webhooks."""
import base64
import hashlib
import hmac
import json
import secrets

from django.conf import settings
from django.core import signing
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from . import services as svc
from .models import AdConnection, User
from .platforms import PLATFORMS
from .platforms.crypto import decrypt
from .platforms.http import PlatformError
from .sync import import_lead, mark_failed, sync_connection
from .views import admin_only, body, err

STATE_SALT = 'oauth-state'


def redirect_uri(platform):
    return f'{settings.PUBLIC_BASE_URL}/api/connections/{platform}/callback'


def connection_json(c):
    d = c.details
    return {
        'id': c.pk, 'platform': c.platform, 'status': c.status, 'error': c.error_message,
        'accountId': c.external_id, 'accountName': c.account_name, 'businessName': c.business_name,
        'connectedBy': c.connected_by.name if c.connected_by else None, 'scopes': c.scopes,
        'expiresAt': svc.iso(c.token_expires_at), 'createdAt': svc.iso(c.created_at),
        'lastSyncAt': svc.iso(c.last_sync_at), 'lastSyncCount': c.last_sync_count, 'login': (d.get('user') or {}).get('email') or (d.get('user') or {}).get('name'),
        'accounts': d.get('accounts') or [{'id': x['id'], 'name': x['name'] or x['id'], 'manager': x['manager']} for x in d.get('customers', [])],
        'pages': [{'id': p['id'], 'name': p['name'], 'listening': p['listening'], 'error': p.get('error')} for p in d.get('pages', [])],
    }


def platforms_json():
    return {k: {'label': m.LABEL, 'configured': m.configured()} for k, m in PLATFORMS.items()} | {'mock': settings.AD_PLATFORMS_MOCK}


@admin_only
def connections(request):
    return JsonResponse({'connections': [connection_json(c) for c in AdConnection.objects.exclude(status='disconnected')], 'platforms': platforms_json()})


@admin_only
def start(request, platform):
    """Step 1: send the browser to the platform's official login/consent screen."""
    m = PLATFORMS.get(platform)
    if not m:
        return err('Unknown platform', 404)
    if not m.configured():
        return err(f'{m.LABEL} is not configured on the server yet (see docs/ad-connections.md)', 409)
    state = signing.dumps({'u': request.user.pk, 'p': platform, 'n': secrets.token_urlsafe(8)}, salt=STATE_SALT)  # signed + expires: blocks CSRF/replay
    return JsonResponse({'url': m.authorize_url(state, redirect_uri(platform))})


def back(**q):
    from urllib.parse import urlencode
    return HttpResponseRedirect(f'{settings.FRONTEND_URL}/#/integrations?{urlencode(q)}')


def callback(request, platform):
    """Step 2: the platform sends the browser back here with ?code=…&state=…. Exchange the code, store the connection."""
    m = PLATFORMS.get(platform)
    q = request.GET
    if not m:
        return back(error='Unknown platform')
    try:
        st = signing.loads(q.get('state', ''), salt=STATE_SALT, max_age=600)
        assert st['p'] == platform
    except Exception:
        return back(error='The sign-in session expired or was tampered with. Please try again.')
    if q.get('error'):  # user pressed Cancel, or the platform refused
        return back(error=q.get('error_description') or q.get('error_reason') or q['error'], platform=platform)
    conn = AdConnection.objects.filter(platform=platform).first() or AdConnection(platform=platform)
    try:
        m.connect(conn, q.get('code', ''), redirect_uri(platform))
    except PlatformError as e:
        return back(error=str(e), platform=platform)
    conn.connected_by = User.objects.filter(pk=st['u']).first()
    conn.status = conn.status if conn.status in ('active', 'expiring') else 'active'
    conn.error_message = conn.error_message if conn.status == 'expiring' else ''
    conn.save()
    svc.notify(f'{m.LABEL} connected' + (f': {conn.account_name}' if conn.account_name else ''))
    try:
        sync_connection(conn)  # first import right away so leads show up immediately
    except Exception:
        pass
    return back(connected=platform)


def mock_consent(request):
    """Stand-in for Meta/Google's consent screen when AD_PLATFORMS_MOCK=1."""
    if not settings.AD_PLATFORMS_MOCK:
        return HttpResponse(status=404)
    q = request.GET
    name = {'meta': 'Meta (Facebook)', 'google': 'Google'}.get(q.get('platform'), '?')
    from urllib.parse import urlencode
    allow = f"{q['redirect_uri']}?{urlencode({'code': 'mock-code', 'state': q['state']})}"
    deny = f"{q['redirect_uri']}?{urlencode({'error': 'access_denied', 'error_description': 'You cancelled the connection', 'state': q['state']})}"
    return HttpResponse(f'''<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><title>Mock {name} sign-in</title>
<body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;background:#f1f5f9;margin:0"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;max-width:380px">
<p style="color:#b45309;font-size:12px;margin:0 0 12px">MOCK MODE: this is not the real {name} login</p>
<h2 style="margin:0 0 8px">BeForth CRM wants access to your {name} account</h2>
<p style="color:#64748b;font-size:14px">It will read your ad accounts and lead forms so new leads appear in the CRM. Real consent screens let you pick the exact Pages and ad accounts to share.</p>
<div style="display:flex;gap:8px;margin-top:20px"><a href="{allow}" style="flex:1;text-align:center;background:#2563eb;color:#fff;padding:10px;border-radius:8px;text-decoration:none">Allow</a>
<a href="{deny}" style="flex:1;text-align:center;border:1px solid #e2e8f0;padding:10px;border-radius:8px;text-decoration:none;color:#0f172a">Cancel</a></div></div></body>''')


def conn_for(pk):
    return AdConnection.objects.filter(pk=pk).exclude(status='disconnected').first()


@admin_only
def select(request, pk):
    """Change which ad account/customer is shown, and (Meta) which Pages we listen to."""
    c, d = conn_for(pk), body(request)
    if not c:
        return err('Not found', 404)
    m = PLATFORMS[c.platform]
    try:
        if c.platform == 'meta':
            m.select(c, account_id=d.get('accountId'), page_ids=d.get('pageIds'))
        elif d.get('accountId'):
            m.select(c, customer_id=d['accountId'])
    except PlatformError as e:
        return err(str(e))
    c.save()
    return JsonResponse(connection_json(c))


@admin_only
def disconnect(request, pk):
    """Revoke at the provider (best effort), then wipe every stored credential."""
    c = conn_for(pk)
    if not c:
        return err('Not found', 404)
    PLATFORMS[c.platform].disconnect(c)
    c.access_token_enc = c.refresh_token_enc = ''
    c.details, c.scopes, c.token_expires_at = {}, [], None
    c.status, c.error_message, c.external_id, c.account_name, c.business_name = 'disconnected', '', '', '', ''
    c.save()
    return JsonResponse({})


@admin_only
def sync_now(request, pk):
    c = conn_for(pk)
    if not c:
        return err('Not found', 404)
    n = sync_connection(c)
    c.refresh_from_db()
    return JsonResponse({'imported': n, 'connection': connection_json(c)})


@admin_only
def recheck(request, pk):
    """Ask the platform if our access still works (updates status + expiry)."""
    c = conn_for(pk)
    if not c:
        return err('Not found', 404)
    try:
        PLATFORMS[c.platform].refresh_status(c)
        c.save()
    except PlatformError as e:
        mark_failed(c, e)
        c.refresh_from_db()
    return JsonResponse(connection_json(c))


# ---------- Meta app-level webhooks (one callback URL for the whole app, configured in the Meta dashboard) ----------
def sig_ok(request):
    if not settings.META_APP_SECRET:
        return settings.AD_PLATFORMS_MOCK or settings.DEBUG
    mac = 'sha256=' + hmac.new(settings.META_APP_SECRET.encode(), request.body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(mac, request.headers.get('X-Hub-Signature-256', ''))


@csrf_exempt
def meta_webhook(request):
    """GET = Meta's subscribe handshake. POST = `leadgen` event: read the lead with that Page's token and import it instantly."""
    if request.method == 'GET':
        q = request.GET
        if settings.META_VERIFY_TOKEN and q.get('hub.mode') == 'subscribe' and hmac.compare_digest(q.get('hub.verify_token', ''), settings.META_VERIFY_TOKEN):
            return HttpResponse(q.get('hub.challenge', ''))
        return err('Bad verify token', 403)
    if not sig_ok(request):
        return err('Bad signature', 403)
    conn = AdConnection.objects.filter(platform='meta', status__in=('active', 'expiring')).first()
    made = []
    for entry in body(request).get('entry', []):
        for ch in entry.get('changes', []):
            v = ch.get('value', {})
            if ch.get('field') != 'leadgen' or not conn:
                continue
            try:
                lead = import_lead(PLATFORMS['meta'].fetch_lead(conn, v.get('leadgen_id'), str(v.get('page_id') or entry.get('id'))))
                if lead:
                    made.append(lead.code)
            except PlatformError as e:
                mark_failed(conn, e)
    return JsonResponse({'ok': True, 'created': made})  # always 200, otherwise Meta retries


@csrf_exempt
def meta_deauthorize(request):
    """Meta calls this when a user removes the app in their Facebook settings. `signed_request` is HMAC-signed with the app secret."""
    sr = request.POST.get('signed_request', '')
    try:
        sig, payload = sr.split('.', 1)
        pad = lambda s: s + '=' * (-len(s) % 4)
        expect = hmac.new(settings.META_APP_SECRET.encode(), payload.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(base64.urlsafe_b64decode(pad(sig)), expect):
            return err('Bad signature', 403)
        uid = json.loads(base64.urlsafe_b64decode(pad(payload))).get('user_id')
    except Exception:
        return err('Bad signed_request', 400)
    for c in AdConnection.objects.filter(platform='meta'):
        if str((c.details.get('user') or {}).get('id')) == str(uid):
            c.access_token_enc, c.status, c.error_message = '', 'revoked', 'The user removed the app in their Facebook settings'
            c.save()
            svc.notify('Meta connection was removed by the account owner. Reconnect to keep leads flowing.')
    return JsonResponse({'ok': True})


@admin_only
def simulate(request, pk):
    """Demo only: pretend the platform just delivered a new lead. Meta goes through the same path as the real webhook."""
    if not settings.AD_PLATFORMS_MOCK:
        return err('Simulation is only available in mock/demo mode', 403)
    c = conn_for(pk)
    if not c:
        return err('Not found', 404)
    try:
        if c.platform == 'meta':
            page = next((p for p in c.details.get('pages', []) if p.get('listening')), None)
            if not page:
                return err('No Page is being listened to')
            lead = import_lead(PLATFORMS['meta'].fetch_lead(c, f'mock-meta-live-{secrets.token_hex(4)}', page['id']))
            made = [lead] if lead else []
        else:
            from datetime import timedelta
            from django.utils import timezone
            made = [l for l in (import_lead(f) for f in PLATFORMS['google'].sync(c, timezone.now() - timedelta(days=1))) if l]
    except PlatformError as e:
        return err(str(e))
    return JsonResponse({'created': [l.code for l in made]})
