import json
from datetime import timedelta
from pathlib import Path

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from leads.models import Activity, Lead, Notification, SourceConfig, User

DEMO_PASSWORD = 'demo1234'


class Command(BaseCommand):
    help = 'Reset to the demo data set (users, 30 leads, activity). Timestamps are shifted to "now".'

    def handle(self, *a, **kw):
        data = json.loads((Path(__file__).parents[2] / 'seed.json').read_text())
        shift = timezone.now() - parse_datetime(data['exportedAt'])
        t = lambda s: parse_datetime(s) + shift if s else None

        Lead.objects.all().delete(); Notification.objects.all().delete(); SourceConfig.objects.all().delete()
        users = {}
        for u in data['users']:
            first, _, last = u['name'].partition(' ')
            obj, _ = User.objects.update_or_create(username=first.lower(), defaults=dict(
                first_name=first, last_name=last, email=u['email'], role=u['role'], is_staff=u['role'] == 'Administrator', is_superuser=u['role'] == 'Administrator'))
            obj.set_password(DEMO_PASSWORD); obj.save()
            users[u['name']] = obj

        for l in data['leads']:
            v = l['verification']
            if v.get('at'):
                v['at'] = t(v['at']).isoformat()
            lead = Lead.objects.create(
                number=int(l['id'][2:]), name=l['name'], company=l['company'], email=l['email'], phone=l['phone'], location=l['location'],
                requirement=l['requirement'], source=l['source'], campaign=l.get('campaign') or '', received_at=t(l['receivedAt']),
                assigned_to=users.get(l.get('assignedTo')), assigned_by=l.get('assignedBy') or '', assigned_at=t(l.get('assignedAt')),
                status=l['status'], priority=l['priority'], value=l['value'], verification=v)
            Activity.objects.bulk_create(Activity(lead=lead, type=a['type'], at=t(a['at']), user=a['user'], description=a['description'],
                                                  due=t(a.get('due')), done=bool(a.get('done'))) for a in l['activities'])
        for n in data['notifications']:
            Notification.objects.create(text=n['text'], lead=Lead.objects.filter(number=int(n['leadId'][2:])).first(), at=t(n['at']), read=n['read'])
        self.stdout.write(self.style.SUCCESS(f'Seeded {Lead.objects.count()} leads. Login: <firstname> / {DEMO_PASSWORD}'))
