"""Meta (Facebook + Instagram) connection: OAuth, token handling, page subscription, lead retrieval."""
import json
import urllib.parse
from datetime import datetime, timedelta, timezone as tz

from django.conf import settings
from django.utils import timezone

from .crypto import decrypt, encrypt
from .http import PlatformError, http_json

NAME = 'meta'
LABEL = 'Meta Ads'


def graph(path=''):
    return f'https://graph.facebook.com/{settings.META_GRAPH_VERSION}/{path.lstrip("/")}'


def configured():
    return settings.AD_PLATFORMS_MOCK or bool(settings.META_APP_ID and settings.META_APP_SECRET)


def authorize_url(state, redirect_uri):
    """The official Meta login dialog. The user picks which Pages / ad accounts / businesses to share there."""
    if settings.AD_PLATFORMS_MOCK:
        from . import mock
        return mock.consent_url(NAME, state, redirect_uri)
    p = {'client_id': settings.META_APP_ID, 'redirect_uri': redirect_uri, 'state': state, 'response_type': 'code'}
    if settings.META_LOGIN_CONFIG_ID:  # Facebook Login for Business: permissions come from the saved configuration
        p.update(config_id=settings.META_LOGIN_CONFIG_ID, override_default_response_type='true')
    else:
        p['scope'] = ','.join(settings.META_SCOPES)
    return f'https://www.facebook.com/{settings.META_GRAPH_VERSION}/dialog/oauth?' + urllib.parse.urlencode(p)


def _app_token():
    return f'{settings.META_APP_ID}|{settings.META_APP_SECRET}'


def connect(conn, code, redirect_uri):
    """code → short-lived token → long-lived token (~60 days) → pages (never-expiring page tokens) + ad accounts."""
    app = {'client_id': settings.META_APP_ID, 'client_secret': settings.META_APP_SECRET}
    short = http_json('GET', graph('oauth/access_token'), params={**app, 'redirect_uri': redirect_uri, 'code': code})
    long = http_json('GET', graph('oauth/access_token'), params={**app, 'grant_type': 'fb_exchange_token', 'fb_exchange_token': short['access_token']})
    token = long['access_token']
    conn.access_token, conn.refresh_token = token, ''  # Meta has no refresh token: re-authorize before expiry
    conn.token_expires_at = timezone.now() + timedelta(seconds=int(long.get('expires_in') or 0)) if long.get('expires_in') else None

    me = http_json('GET', graph('me'), params={'fields': 'id,name', 'access_token': token})
    pages = http_json('GET', graph('me/accounts'), params={'fields': 'id,name,access_token', 'limit': 100, 'access_token': token}).get('data', [])
    try:
        ads = http_json('GET', graph('me/adaccounts'), params={'fields': 'account_id,name,currency,business{id,name}', 'limit': 100, 'access_token': token}).get('data', [])
    except PlatformError:  # ads_read not granted: still fine for lead retrieval
        ads = []
    conn.details = {
        'user': me,
        'pages': [{'id': p['id'], 'name': p['name'], 'token_enc': encrypt(p.get('access_token', '')), 'listening': False} for p in pages],
        'accounts': [{'id': a['account_id'], 'name': a.get('name', ''), 'currency': a.get('currency', ''), 'business_id': (a.get('business') or {}).get('id', ''), 'business_name': (a.get('business') or {}).get('name', '')} for a in ads],
    }
    refresh_status(conn)
    select(conn, account_id=(conn.details['accounts'][0]['id'] if ads else ''), page_ids=[p['id'] for p in pages])


def refresh_status(conn):
    """Ask Meta whether the token is still valid, and which permissions the user actually granted."""
    d = http_json('GET', graph('debug_token'), params={'input_token': conn.access_token, 'access_token': _app_token()}).get('data', {})
    if not d.get('is_valid', False):
        raise PlatformError((d.get('error') or {}).get('message', 'Token is no longer valid'), kind='auth')
    conn.scopes = d.get('scopes', [])
    exp = d.get('expires_at') or 0  # 0 = does not expire
    conn.token_expires_at = datetime.fromtimestamp(exp, tz.utc) if exp else None
    conn.details['data_access_expires_at'] = d.get('data_access_expires_at') or 0
    if conn.token_expires_at and conn.token_expires_at - timezone.now() < timedelta(days=7):
        conn.status, conn.error_message = 'expiring', 'Access expires soon. Reconnect to keep leads flowing.'
    else:
        conn.status, conn.error_message = 'active', ''


def select(conn, account_id=None, page_ids=None):
    """Choose the ad account to show, and the Pages whose lead forms we listen to (subscribes them to `leadgen`)."""
    if account_id is not None:
        a = next((x for x in conn.details.get('accounts', []) if x['id'] == account_id), None)
        conn.external_id = account_id
        conn.account_name = a['name'] if a else ''
        conn.business_id, conn.business_name = (a['business_id'], a['business_name']) if a else ('', '')
    if page_ids is not None:
        for p in conn.details.get('pages', []):
            want, token = p['id'] in page_ids, decrypt(p['token_enc'])
            if want and not p['listening']:
                try:
                    http_json('POST', graph(f'{p["id"]}/subscribed_apps'), data={'subscribed_fields': 'leadgen', 'access_token': token})
                    p['listening'] = True
                    p.pop('error', None)
                except PlatformError as e:
                    p['error'] = str(e)
            elif not want and p['listening']:
                try:
                    http_json('DELETE', graph(f'{p["id"]}/subscribed_apps'), params={'access_token': token})
                except PlatformError:
                    pass
                p['listening'] = False


def disconnect(conn):
    """Best effort: stop page subscriptions, then remove our app's permissions for this user."""
    for p in conn.details.get('pages', []):
        if p.get('listening'):
            try:
                http_json('DELETE', graph(f'{p["id"]}/subscribed_apps'), params={'access_token': decrypt(p['token_enc'])})
            except PlatformError:
                pass
    try:
        http_json('DELETE', graph('me/permissions'), params={'access_token': conn.access_token})
    except PlatformError:
        pass


FIELDS = 'id,created_time,field_data,ad_id,ad_name,campaign_name,form_id,platform'


def _lead(raw, page_name=''):
    from ..views import meta_fields
    source = {'fb': 'Facebook', 'ig': 'Instagram'}.get(raw.get('platform', ''), 'Meta Ads')
    return {'source': source, 'external_id': f'meta:{raw["id"]}', 'campaign': raw.get('campaign_name') or raw.get('ad_name') or page_name,
            'raw': raw, **meta_fields(raw.get('field_data', []))}


def fetch_lead(conn, leadgen_id, page_id):
    """Real-time path: Meta's webhook gives a leadgen id, we read the full lead with that Page's token."""
    p = next((x for x in conn.details.get('pages', []) if x['id'] == page_id), None)
    if not p:
        raise PlatformError('Page is not connected')
    return _lead(http_json('GET', graph(leadgen_id), params={'fields': FIELDS, 'access_token': decrypt(p['token_enc'])}), p['name'])


def sync(conn, since):
    """Backstop path: read every lead on the listened Pages' forms created after `since` (datetime)."""
    out = []
    for p in conn.details.get('pages', []):
        if not p.get('listening'):
            continue
        token = decrypt(p['token_enc'])
        forms = http_json('GET', graph(f'{p["id"]}/leadgen_forms'), params={'fields': 'id,name', 'limit': 100, 'access_token': token}).get('data', [])
        for f in forms:
            params = {'fields': FIELDS, 'limit': 100, 'access_token': token,
                      'filtering': json.dumps([{'field': 'time_created', 'operator': 'GREATER_THAN', 'value': int(since.timestamp())}])}
            url, pages_left = graph(f'{f["id"]}/leads'), 5
            while url and pages_left:
                r = http_json('GET', url, params=params)
                out += [_lead(x, f.get('name') or p['name']) for x in r.get('data', [])]
                url, params, pages_left = (r.get('paging') or {}).get('next'), None, pages_left - 1
    return out
