"""Google Ads connection: OAuth (offline access), accessible customers, lead form submissions."""
import urllib.parse
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .http import PlatformError, http_json

NAME = 'google'
LABEL = 'Google Ads'
SCOPES = ['https://www.googleapis.com/auth/adwords', 'openid', 'email']
TOKEN_URL = 'https://oauth2.googleapis.com/token'


def api(path):
    return f'https://googleads.googleapis.com/{settings.GOOGLE_ADS_API_VERSION}/{path.lstrip("/")}'


def configured():
    return settings.AD_PLATFORMS_MOCK or bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET and settings.GOOGLE_DEVELOPER_TOKEN)


def authorize_url(state, redirect_uri):
    """Google's consent screen. access_type=offline + prompt=consent is what makes Google return a refresh token."""
    if settings.AD_PLATFORMS_MOCK:
        from . import mock
        return mock.consent_url(NAME, state, redirect_uri)
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode({
        'client_id': settings.GOOGLE_CLIENT_ID, 'redirect_uri': redirect_uri, 'response_type': 'code', 'scope': ' '.join(SCOPES),
        'access_type': 'offline', 'prompt': 'consent', 'include_granted_scopes': 'true', 'state': state})


def _headers(conn, customer_id=None):
    h = {'Authorization': f'Bearer {conn.access_token}', 'developer-token': settings.GOOGLE_DEVELOPER_TOKEN}
    login = settings.GOOGLE_LOGIN_CUSTOMER_ID or customer_id
    if login:
        h['login-customer-id'] = login.replace('-', '')
    return h


def _store_tokens(conn, r):
    conn.access_token = r['access_token']
    conn.token_expires_at = timezone.now() + timedelta(seconds=int(r.get('expires_in', 3600)))
    if r.get('refresh_token'):
        conn.refresh_token = r['refresh_token']
    if r.get('scope'):
        conn.scopes = r['scope'].split()


def connect(conn, code, redirect_uri):
    r = http_json('POST', TOKEN_URL, data={'code': code, 'client_id': settings.GOOGLE_CLIENT_ID, 'client_secret': settings.GOOGLE_CLIENT_SECRET,
                                           'redirect_uri': redirect_uri, 'grant_type': 'authorization_code'})
    if not r.get('refresh_token') and not conn.refresh_token:
        raise PlatformError('Google did not return a refresh token. Remove this app at myaccount.google.com/permissions and connect again.')
    _store_tokens(conn, r)
    email = http_json('GET', 'https://openidconnect.googleapis.com/v1/userinfo', headers={'Authorization': f'Bearer {conn.access_token}'}).get('email', '')

    ids = [n.split('/')[-1] for n in http_json('GET', api('customers:listAccessibleCustomers'), headers=_headers(conn)).get('resourceNames', [])][:25]
    customers = []
    for cid in ids:
        try:  # name + whether it is a manager (MCC) account
            rows = http_json('POST', api(f'customers/{cid}/googleAds:search'), headers=_headers(conn, cid),
                             json_body={'query': 'SELECT customer.id, customer.descriptive_name, customer.manager, customer.currency_code FROM customer LIMIT 1'}).get('results', [])
            c = rows[0]['customer'] if rows else {}
        except PlatformError:
            c = {}  # e.g. cancelled account, or access only through a manager we do not know
        customers.append({'id': cid, 'name': c.get('descriptiveName', ''), 'manager': bool(c.get('manager')), 'currency': c.get('currencyCode', '')})
    conn.details = {'user': {'email': email}, 'customers': customers}
    conn.status, conn.error_message = 'active', ''
    first = next((c for c in customers if not c['manager']), customers[0] if customers else None)
    select(conn, customer_id=first['id'] if first else '')


def select(conn, customer_id):
    c = next((x for x in conn.details.get('customers', []) if x['id'] == customer_id), None)
    conn.external_id, conn.account_name = customer_id, (c or {}).get('name', '')
    conn.business_id, conn.business_name = '', ''


def ensure_token(conn):
    """Access tokens last about an hour. Mint a new one from the stored refresh token when needed."""
    if conn.token_expires_at and conn.token_expires_at - timezone.now() > timedelta(minutes=2):
        return
    if not conn.refresh_token:
        raise PlatformError('No refresh token stored', kind='revoked')
    _store_tokens(conn, http_json('POST', TOKEN_URL, data={'client_id': settings.GOOGLE_CLIENT_ID, 'client_secret': settings.GOOGLE_CLIENT_SECRET,
                                                           'refresh_token': conn.refresh_token, 'grant_type': 'refresh_token'}))


def refresh_status(conn):
    ensure_token(conn)
    conn.status, conn.error_message = 'active', ''


def disconnect(conn):
    try:
        http_json('POST', 'https://oauth2.googleapis.com/revoke', data={'token': conn.refresh_token or conn.access_token})
    except PlatformError:
        pass


def _value(fields, *types):
    for t in types:
        v = next((f.get('fieldValue') for f in fields if f.get('fieldType') == t and f.get('fieldValue')), '')
        if v:
            return v
    return ''


def sync(conn, since):
    ensure_token(conn)
    cid = conn.external_id
    if not cid:
        raise PlatformError('Choose a Google Ads account first')
    h = _headers(conn, cid)
    q = ("SELECT lead_form_submission_data.id, lead_form_submission_data.submission_date_time, lead_form_submission_data.campaign, "
         "lead_form_submission_data.lead_form_submission_fields, lead_form_submission_data.custom_lead_form_submission_fields "
         f"FROM lead_form_submission_data WHERE lead_form_submission_data.submission_date_time >= '{since.strftime('%Y-%m-%d %H:%M:%S')}'")
    rows = http_json('POST', api(f'customers/{cid}/googleAds:search'), headers=h, json_body={'query': q}).get('results', [])
    names = {}
    if rows:  # campaign names for the lead's campaign column
        try:
            for r in http_json('POST', api(f'customers/{cid}/googleAds:search'), headers=h, json_body={'query': 'SELECT campaign.resource_name, campaign.name FROM campaign'}).get('results', []):
                names[r['campaign']['resourceName']] = r['campaign'].get('name', '')
        except PlatformError:
            pass
    out = []
    for r in rows:
        d = r['leadFormSubmissionData']
        f, custom = d.get('leadFormSubmissionFields', []), d.get('customLeadFormSubmissionFields', [])
        name = _value(f, 'FULL_NAME') or f"{_value(f, 'FIRST_NAME')} {_value(f, 'LAST_NAME')}".strip() or 'Google lead'
        out.append({'source': 'Google Ads', 'external_id': f'google:{cid}:{d["id"]}', 'name': name,
                    'email': _value(f, 'EMAIL', 'WORK_EMAIL'), 'phone': _value(f, 'PHONE_NUMBER', 'WORK_PHONE'), 'company': _value(f, 'COMPANY_NAME'),
                    'location': _value(f, 'CITY'), 'requirement': (custom[0].get('fieldValue', '') if custom else '') or _value(f, 'JOB_TITLE'),
                    'campaign': names.get(d.get('campaign', ''), d.get('campaign', '')), 'raw': d})
    return out
