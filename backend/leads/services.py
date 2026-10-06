"""Domain logic shared by the UI API and the ingestion webhooks."""
import re

from django.db.models import Q
from django.utils import timezone

import random

from django.conf import settings

from .models import Activity, Lead, Notification, SourceConfig, User, Webhook

SOURCES = ['Website', 'Meta Ads', 'Google Ads', 'Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Manual Entry']
STATUSES = ['New', 'Pending Verification', 'Verified', 'Contacted', 'Qualified', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']
OPEN_STATUSES = ('New', 'Pending Verification', 'Lost')  # reachable without a Genuine verification


def iso(d):
    return d.isoformat() if d else None


def digits(s):
    return re.sub(r'\D', '', s or '')[-10:]


def log(lead, type_, description, user='System', **extra):
    return Activity.objects.create(lead=lead, type=type_, description=description, user=user, **extra)


def notify(text, lead=None):
    Notification.objects.create(text=text, lead=lead)


def duplicates(lead):
    q = Q()
    if len(digits(lead.phone)) == 10:
        q |= Q(phone__endswith=digits(lead.phone))
    if lead.email:
        q |= Q(email__iexact=lead.email)
    if lead.company:
        q |= Q(company__iexact=lead.company)
    return Lead.objects.filter(q).exclude(pk=lead.pk) if q else Lead.objects.none()


def create_lead(source, by='System', **fields):
    """Single entry point for every new lead: UI, website form, Meta, Google."""
    lead = Lead.objects.create(source=source, **fields)
    log(lead, 'System', f'Lead received via {source}', user=by)
    notify(f'New lead received: {lead.name} ({source})', lead)
    dups = list(duplicates(lead)[:3])
    if dups:
        log(lead, 'System', 'Possible duplicate lead found: ' + ', '.join(d.code for d in dups))
    return lead


def source_enabled(name):
    return SourceConfig.objects.get_or_create(name=name)[0].enabled


def user_json(u):
    return {'name': u.name, 'role': u.role, 'email': u.email}


def activity_json(a):
    return {'id': str(a.id), 'type': a.type, 'at': iso(a.at), 'user': a.user, 'description': a.description,
            'due': iso(a.due), 'done': a.done if a.due else None}


def lead_json(l):
    return {
        'id': l.code, 'name': l.name, 'company': l.company, 'email': l.email, 'phone': l.phone,
        'location': l.location, 'requirement': l.requirement, 'source': l.source, 'campaign': l.campaign or None,
        'receivedAt': iso(l.received_at), 'assignedTo': l.assigned_to.name if l.assigned_to else None,
        'assignedBy': l.assigned_by or None, 'assignedAt': iso(l.assigned_at), 'status': l.status,
        'priority': l.priority, 'value': l.value, 'verification': l.verification or {'checks': {}},
        'activities': [activity_json(a) for a in l.activities.all()],
    }


def visible_leads(user):
    qs = Lead.objects.select_related('assigned_to').prefetch_related('activities')
    return qs.filter(assigned_to=user) if user.role == 'Salesperson' else qs


def state_json(user):
    names = dict(SourceConfig.objects.values_list('name', 'enabled'))
    return {
        'user': user_json(user),
        'leads': [lead_json(l) for l in visible_leads(user)],
        'dupIndex': [{'id': l.code, 'name': l.name, 'status': l.status, 'phone': l.phone, 'email': l.email, 'company': l.company} for l in Lead.objects.all()],
        'notifications': [{'id': str(n.id), 'text': n.text, 'leadId': n.lead.code if n.lead else None, 'at': iso(n.at), 'read': n.read} for n in Notification.objects.select_related('lead')[:30]],
        'sources': {s: names.get(s, True) for s in SOURCES},
        'webhooks': [webhook_json(h) for h in Webhook.objects.prefetch_related('deliveries')] if user.role == 'Administrator' else [],
        'connections': connections_payload() if user.role == 'Administrator' else {'connections': [], 'platforms': {}},
        'salespeople': [u.name for u in User.objects.filter(role='Salesperson')],
    }


def webhook_json(h):
    ds = list(h.deliveries.all()[:10])
    return {
        'id': h.pk, 'name': h.name, 'kind': h.kind, 'path': f'/api/hooks/{h.token}', 'secret': h.secret, 'campaign': h.campaign,
        'enabled': h.enabled, 'createdAt': iso(h.created_at), 'createdBy': h.created_by,
        'total': h.deliveries.filter(test=False, ok=True).count(), 'lastAt': iso(ds[0].at) if ds else None,
        'metaConfigured': bool(settings.META_PAGE_TOKEN),
        'deliveries': [{'id': d.pk, 'at': iso(d.at), 'ok': d.ok, 'test': d.test, 'message': d.message, 'leads': d.leads, 'payload': d.payload[:600]} for d in ds],
    }


def sample_person():
    n = random.randint(100, 999)
    return dict(name=f'Test Lead {n}', phone=f'+91 98{n}0 1{n}2', email=f'test{n}@example.in', company=f'Demo Industries {n}', location='Pune', requirement='ERP Software')


def sample_payload(kind, p=None, platform='', key=''):
    """A realistic payload in each source's own format, used by the test button and simulate."""
    p = p or sample_person()
    if kind == 'website':
        return {**p, 'utm_campaign': 'test'}
    if kind == 'meta':
        fd = [{'name': k, 'values': [v]} for k, v in (('full_name', p['name']), ('phone_number', p['phone']), ('email', p['email']), ('company_name', p['company']), ('city', p['location']))]
        return {'entry': [{'changes': [{'field': 'leadgen', 'value': {'form_id': '1', 'campaign_name': 'Test Lead Ad', 'platform': platform, 'field_data': fd}}]}]}
    return {'google_key': key, 'campaign_id': 'test', 'user_column_data': [{'column_id': k, 'string_value': v} for k, v in (('FULL_NAME', p['name']), ('EMAIL', p['email']), ('PHONE_NUMBER', p['phone']), ('COMPANY_NAME', p['company']), ('CITY', p['location']))]}


def connections_payload():
    from .connect_views import connection_json, platforms_json
    from .models import AdConnection
    return {'connections': [connection_json(c) for c in AdConnection.objects.exclude(status='disconnected')], 'platforms': platforms_json()}
