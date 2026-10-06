import hashlib
import hmac
import json
import logging
import urllib.parse
import urllib.request
from functools import wraps

from django.conf import settings
from django.contrib.auth import authenticate
from django.core import signing
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import csrf_exempt

from . import services as svc
from types import SimpleNamespace

from .models import Activity, Delivery, Lead, Notification, SourceConfig, User, Webhook, _secret, _token

log = logging.getLogger(__name__)
SALT = 'crm-token'


# ---------- plumbing ----------
def body(request):
    try:
        return json.loads(request.body or b'{}')
    except ValueError:
        return {}


def err(msg, status=400):
    return JsonResponse({'error': msg}, status=status)


def api(fn):
    """CSRF-exempt JSON endpoint that needs a signed bearer token."""
    @csrf_exempt
    @wraps(fn)
    def wrapper(request, *a, **kw):
        tok = request.headers.get('Authorization', '').removeprefix('Bearer ')
        try:
            request.user = User.objects.get(pk=signing.loads(tok, salt=SALT, max_age=7 * 86400)['uid'])
        except Exception:
            return err('Not signed in', 401)
        return fn(request, *a, **kw)
    return wrapper


def lead_for(request, code):
    qs = svc.visible_leads(request.user)
    return qs.filter(number=int(code.removeprefix('L-'))).first()


def reply(request, lead):
    return JsonResponse(svc.lead_json(Lead.objects.prefetch_related('activities').get(pk=lead.pk)))


# ---------- auth + state ----------
@csrf_exempt
def login(request):
    d = body(request)
    u = authenticate(username=d.get('username', ''), password=d.get('password', ''))
    if not u:
        return err('Wrong username or password', 401)
    return JsonResponse({'token': signing.dumps({'uid': u.pk}, salt=SALT), 'user': svc.user_json(u)})


@api
def state(request):
    return JsonResponse(svc.state_json(request.user))


# ---------- lead actions (the UI) ----------
@api
def leads(request):
    d = body(request)
    if not d.get('name'):
        return err('Name is required')
    fields = {k: str(d.get(k, ''))[:240] for k in ('name', 'company', 'email', 'phone', 'location', 'requirement')}
    lead = svc.create_lead(d.get('source') if d.get('source') in svc.SOURCES else 'Manual Entry', by=request.user.name,
                           value=int(d.get('value') or 0), priority=d.get('priority', 'Warm'), **fields)
    return reply(request, lead)


@api
def verify(request, code):
    lead, d = lead_for(request, code), body(request)
    if not lead:
        return err('Not found', 404)
    result, checks = d.get('result'), d.get('checks', {})
    if result not in ('Genuine', 'Not Genuine', 'Need More Information'):
        return err('Invalid result')
    if result == 'Genuine' and not all(checks.get(k) for k in ('phone', 'email', 'company', 'requirement', 'duplicate')):
        return err('Genuine requires every check')
    nxt = None
    if result == 'Genuine' and lead.status in ('New', 'Pending Verification'):
        nxt = 'Verified'
    elif result == 'Not Genuine':
        nxt = 'Lost'  # retained, not deleted
    elif result == 'Need More Information' and lead.status == 'New':
        nxt = 'Pending Verification'
    note = d.get('note', '')
    svc.log(lead, 'System', f'Verification: {result}' + (f' ({note})' if note else ''), request.user.name)
    if nxt and nxt != lead.status:
        svc.log(lead, 'System', f'Status changed: {lead.status} → {nxt}', request.user.name)
        lead.status = nxt
    lead.verification = {'checks': checks, 'result': result, 'note': note, 'by': request.user.name, 'at': timezone.now().isoformat()}
    lead.save()
    if result == 'Need More Information':
        svc.notify(f'Lead verification pending: {lead.name}', lead)
    return reply(request, lead)


@api
def assign(request, code):
    lead, d = lead_for(request, code), body(request)
    if not lead:
        return err('Not found', 404)
    if request.user.role == 'Salesperson':
        return err('Only managers and admins can assign', 403)
    if lead.verification.get('result') != 'Genuine':
        return err('Verify the lead as Genuine first')
    to = next((u for u in User.objects.filter(role='Salesperson') if u.name == d.get('to')), None)
    if not to:
        return err('Unknown salesperson')
    prev, prio = lead.assigned_to, d.get('priority', lead.priority)
    re = prev and prev != to
    svc.log(lead, 'System', f'Reassigned from {prev.name} to {to.name}' if re else f'Assigned to {to.name}', request.user.name)
    if prio != lead.priority:
        svc.log(lead, 'System', f'Priority changed: {lead.priority} → {prio}', request.user.name)
    lead.assigned_to, lead.assigned_by, lead.assigned_at, lead.priority = to, request.user.name, timezone.now(), prio
    lead.save()
    svc.notify(f'Lead {"reassigned" if re else "assigned"}: {lead.name} → {to.name}', lead)
    return reply(request, lead)


@api
def set_status(request, code):
    lead, status = lead_for(request, code), body(request).get('status')
    if not lead:
        return err('Not found', 404)
    if status not in svc.STATUSES:
        return err('Invalid status')
    if status not in svc.OPEN_STATUSES and lead.verification.get('result') != 'Genuine':
        return err('Only leads verified as Genuine can move further in the pipeline')
    if status != lead.status:
        svc.log(lead, 'System', f'Status changed: {lead.status} → {status}', request.user.name)
        lead.status = status
        lead.save()
    return reply(request, lead)


@api
def add_activity(request, code):
    lead, d = lead_for(request, code), body(request)
    if not lead:
        return err('Not found', 404)
    if d.get('type') not in ('Call', 'Email', 'Meeting', 'WhatsApp', 'Note', 'Follow-up'):
        return err('Invalid activity type')
    due = parse_datetime(d['due']) if d.get('due') else None
    if d['type'] == 'Follow-up' and not due:
        return err('Follow-up needs a date')
    svc.log(lead, d['type'], d.get('description') or f"{d['type']} recorded", request.user.name, due=due)
    return reply(request, lead)


@api
def finish_followup(request, code, pk):
    lead = lead_for(request, code)
    if not lead:
        return err('Not found', 404)
    Activity.objects.filter(pk=pk, lead=lead).update(done=True)
    return reply(request, lead)


@api
def read_all(request):
    Notification.objects.update(read=True)
    return JsonResponse({})


@api
def toggle_source(request, name):
    if request.user.role != 'Administrator' or name not in svc.SOURCES:
        return err('Not allowed', 403)
    s, _ = SourceConfig.objects.get_or_create(name=name)
    s.enabled = not s.enabled
    s.save()
    return JsonResponse({})


# ---------- ingestion: webhooks created in the CRM ----------
class HookError(Exception):
    def __init__(self, msg, status=400):
        super().__init__(msg)
        self.status = status


def cors(resp):
    resp['Access-Control-Allow-Origin'] = '*'
    resp['Access-Control-Allow-Headers'] = 'Content-Type'
    return resp


def ingest(source, hook, **f):
    """Common tail for every source: honour the source switch, apply the default campaign, create the lead."""
    if not svc.source_enabled(source):
        raise HookError(f'{source} is paused in Lead Sources', 202)
    raw = f.pop('raw', {})
    f['campaign'] = f.get('campaign') or hook.campaign
    return svc.create_lead(source, raw=raw, **{k: (v or '')[:240] for k, v in f.items()})


def process_website(d, hook, request=None):
    """name, phone and/or email required; company, location, requirement, campaign/utm_campaign optional."""
    if d.get('hp'):  # honeypot, bots fill it in
        return []
    name, phone, email = str(d.get('name', '')).strip(), d.get('phone', ''), d.get('email', '')
    if not name or not (phone or email):
        raise HookError('name and phone or email are required')
    return [ingest('Website', hook, name=name, phone=phone, email=email, company=d.get('company', ''),
                   location=d.get('location', d.get('city', '')), requirement=d.get('requirement', d.get('message', '')),
                   campaign=d.get('campaign', d.get('utm_campaign', '')), raw=d)]


def meta_fields(field_data):
    f = {x['name'].lower(): (x.get('values') or [''])[0] for x in field_data}
    pick = lambda *keys: next((f[k] for k in keys if f.get(k)), '')
    return dict(name=pick('full_name', 'name') or f"{f.get('first_name', '')} {f.get('last_name', '')}".strip() or 'Meta lead',
                email=pick('email'), phone=pick('phone_number', 'phone'), company=pick('company_name', 'company'),
                location=pick('city', 'location'), requirement=pick('requirement', 'message', 'what_are_you_looking_for'))


def fetch_meta_lead(leadgen_id):
    if not (leadgen_id and settings.META_PAGE_TOKEN):
        raise HookError('META_PAGE_TOKEN is not set on the server, cannot fetch lead details', 200)
    url = f'https://graph.facebook.com/v21.0/{leadgen_id}?' + urllib.parse.urlencode(
        {'access_token': settings.META_PAGE_TOKEN, 'fields': 'field_data,created_time,ad_name,campaign_name,form_id,platform'})
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            return json.load(r)
    except Exception as e:
        log.exception('Graph API fetch failed for %s', leadgen_id)
        raise HookError(f'Graph API fetch failed: {e}', 200)  # 200 so Meta does not retry forever


def process_meta(d, hook, request=None):
    made = []
    for entry in d.get('entry', []):
        for ch in entry.get('changes', []):
            v = ch.get('value', {})
            if ch.get('field') != 'leadgen':
                continue
            data = v if 'field_data' in v else fetch_meta_lead(v.get('leadgen_id'))  # inline field_data = test payloads
            source = {'fb': 'Facebook', 'ig': 'Instagram'}.get(data.get('platform', ''), 'Meta Ads')
            made.append(ingest(source, hook, campaign=data.get('campaign_name') or data.get('ad_name') or '',
                               raw=data, **meta_fields(data.get('field_data', []))))
    return made


def process_google(d, hook, request=None):
    if not hmac.compare_digest(str(d.get('google_key', '')), hook.secret):
        raise HookError('google_key does not match this webhook', 403)
    cols = {c.get('column_id', ''): c.get('string_value', '') for c in d.get('user_column_data', [])}
    return [ingest('Google Ads', hook, name=cols.get('FULL_NAME') or f"{cols.get('FIRST_NAME', '')} {cols.get('LAST_NAME', '')}".strip() or 'Google lead',
                   email=cols.get('EMAIL', ''), phone=cols.get('PHONE_NUMBER', ''), company=cols.get('COMPANY_NAME', ''),
                   location=cols.get('CITY', ''), requirement=cols.get('JOB_TITLE', ''),
                   campaign=str(d.get('campaign_id', '')), raw=d)]


PROCESS = {'website': process_website, 'meta': process_meta, 'google': process_google}


def deliver(hook, data, test=False, raw_text=''):
    """Run the processor for this webhook kind and record the delivery. Returns (json, status)."""
    try:
        if not hook.enabled and not test:
            raise HookError('webhook is disabled', 202)
        leads = PROCESS[hook.kind](data, hook)
        out, status, ok, msg = {'ok': True, 'created': [l.code for l in leads]}, 200, True, f'{len(leads)} lead(s) created'
    except HookError as e:
        out, status, ok, msg = {'ok': False, 'error': str(e)}, e.status, False, str(e)
    Delivery.objects.create(webhook=hook, ok=ok, message=msg[:240], leads=', '.join(out.get('created', [])), test=test, payload=(raw_text or json.dumps(data))[:4000])
    return out, status


@csrf_exempt
def hook(request, token):
    """Public entry point: /api/hooks/<token>. GET handles Meta's subscribe handshake."""
    h = Webhook.objects.filter(token=token).first()
    if not h:
        return cors(err('Unknown webhook', 404))
    if request.method == 'OPTIONS':
        return cors(HttpResponse())
    if request.method == 'GET':
        q = request.GET
        if h.kind == 'meta' and q.get('hub.mode') == 'subscribe' and hmac.compare_digest(q.get('hub.verify_token', ''), h.secret):
            return HttpResponse(q.get('hub.challenge', ''))
        return cors(err('This URL accepts POST requests' if h.kind != 'meta' else 'Bad verify token', 405 if h.kind != 'meta' else 403))
    if request.method != 'POST':
        return cors(err('POST only', 405))
    if h.kind == 'meta' and settings.META_APP_SECRET:
        sig = 'sha256=' + hmac.new(settings.META_APP_SECRET.encode(), request.body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, request.headers.get('X-Hub-Signature-256', '')):
            return cors(err('Bad signature', 403))
    text = request.body.decode('utf-8', 'replace')
    data = body(request) if request.content_type == 'application/json' or text.lstrip().startswith('{') else request.POST.dict()
    out, status = deliver(h, data, raw_text=text)
    return cors(JsonResponse(out, status=status))


# ---------- webhook management (admin) ----------
def admin_only(fn):
    @wraps(fn)
    def w(request, *a, **kw):
        if request.user.role != 'Administrator':
            return err('Admins only', 403)
        return fn(request, *a, **kw)
    return api(w)


@admin_only
def webhooks(request):
    d = body(request)
    if d.get('kind') not in PROCESS or not str(d.get('name', '')).strip():
        return err('Name and a valid type are required')
    h = Webhook.objects.create(name=d['name'].strip()[:80], kind=d['kind'], campaign=str(d.get('campaign', ''))[:120], created_by=request.user.name)
    return JsonResponse(svc.webhook_json(h))


@admin_only
def webhook_action(request, pk, action):
    h = Webhook.objects.filter(pk=pk).first()
    if not h:
        return err('Not found', 404)
    if action == 'toggle':
        h.enabled = not h.enabled
        h.save()
    elif action == 'rotate':
        h.token, h.secret = _token(), _secret()
        h.save()
    elif action == 'delete':
        h.delete()
        return JsonResponse({})
    elif action == 'test':
        out, status = deliver(h, svc.sample_payload(h.kind, key=h.secret), test=True)
        return JsonResponse(out, status=200 if out['ok'] else 400)
    return JsonResponse(svc.webhook_json(h))


@api
def simulate(request):
    """Lead Sources 'Simulate lead': runs the real ingestion code with a sample payload."""
    source = body(request).get('source')
    kind = {'Website': 'website', 'Meta Ads': 'meta', 'Facebook': 'meta', 'Instagram': 'meta', 'Google Ads': 'google'}.get(source)
    n = svc.sample_person()
    if not kind:
        svc.create_lead(source if source in svc.SOURCES else 'Manual Entry', by=request.user.name, **n)
        return JsonResponse({})
    stub = SimpleNamespace(campaign='Demo campaign', secret='demo', enabled=True)
    try:
        payload = svc.sample_payload(kind, n, platform={'Facebook': 'fb', 'Instagram': 'ig'}.get(source, ''), key='demo')
        PROCESS[kind](payload, stub)
    except HookError as e:
        return err(str(e), e.status if e.status >= 400 else 409)
    return JsonResponse({})


@api
def reset(request):
    """Demo helper: wipe back to the seeded data set. Admin only."""
    if request.user.role != 'Administrator':
        return err('Not allowed', 403)
    from django.core.management import call_command
    call_command('seed', verbosity=0)
    return JsonResponse({})
