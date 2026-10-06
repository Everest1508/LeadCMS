import hashlib
import hmac
import json
from unittest import mock

from django.core import signing
from django.test import TestCase, override_settings
from django.utils import timezone
from urllib.parse import parse_qs, urlparse

from .connect_views import STATE_SALT
from .models import AdConnection, Lead, User
from .platforms.http import PlatformError
from .sync import sync_connection


@override_settings(AD_PLATFORMS_MOCK=True, PUBLIC_BASE_URL='http://testserver', FRONTEND_URL='http://testserver', META_APP_SECRET='shh', META_VERIFY_TOKEN='vt')
class ConnectionTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user('neha', password='x', role='Administrator', first_name='Neha')
        self.sales = User.objects.create_user('amit', password='x', role='Salesperson', first_name='Amit')
        self.auth = {'HTTP_AUTHORIZATION': 'Bearer ' + signing.dumps({'uid': self.admin.pk}, salt='crm-token')}

    def connect(self, platform):
        url = self.client.post(f'/api/connections/{platform}/start', **self.auth).json()['url']
        state = parse_qs(urlparse(url).query)['state'][0]
        return self.client.get(f'/api/connections/{platform}/callback', {'code': 'mock-code', 'state': state})

    def test_only_admins_can_start(self):
        tok = {'HTTP_AUTHORIZATION': 'Bearer ' + signing.dumps({'uid': self.sales.pk}, salt='crm-token')}
        self.assertEqual(self.client.post('/api/connections/meta/start', **tok).status_code, 403)

    def test_meta_connect_stores_encrypted_tokens_and_imports_leads(self):
        r = self.connect('meta')
        self.assertIn('connected=meta', r['Location'])
        c = AdConnection.objects.get(platform='meta')
        self.assertEqual((c.status, c.business_name, c.account_name), ('active', 'ABC Company', 'ABC Main Ad Account'))
        self.assertEqual(c.access_token, 'mock-long')
        self.assertNotIn('mock-long', c.access_token_enc)  # encrypted at rest
        self.assertNotIn('mock-page-1', json.dumps(c.details))  # page tokens too
        self.assertTrue(all(p['listening'] for p in c.details['pages']))
        self.assertIn('leads_retrieval', c.scopes)
        self.assertEqual(Lead.objects.exclude(external_id='').count(), 2)  # first import on connect: one lead per listened Page form

    def test_google_connect_picks_non_manager_customer(self):
        self.connect('google')
        c = AdConnection.objects.get(platform='google')
        self.assertEqual((c.external_id, c.account_name), ('1234567890', 'ABC Company Search Ads'))
        self.assertEqual(c.refresh_token, 'mock-g-refresh')
        self.assertNotIn('mock-g-refresh', c.refresh_token_enc)
        self.assertEqual(Lead.objects.get(source='Google Ads').campaign, 'Search – ERP Software')

    def test_tampered_or_missing_state_is_rejected(self):
        r = self.client.get('/api/connections/meta/callback', {'code': 'x', 'state': 'forged'})
        self.assertIn('error=', r['Location'])
        self.assertFalse(AdConnection.objects.exists())

    def test_user_cancelling_does_not_connect(self):
        url = self.client.post('/api/connections/google/start', **self.auth).json()['url']
        state = parse_qs(urlparse(url).query)['state'][0]
        r = self.client.get('/api/connections/google/callback', {'error': 'access_denied', 'state': state})
        self.assertIn('error=', r['Location'])
        self.assertFalse(AdConnection.objects.exists())

    def test_sync_is_idempotent(self):
        self.connect('meta')
        c = AdConnection.objects.get(platform='meta')
        same = {'id': 'same-1', 'platform': 'fb', 'field_data': [{'name': 'full_name', 'values': ['Dup Person']}]}
        with mock.patch('leads.platforms.meta.http_json', side_effect=lambda m, u, **k: {'data': {'is_valid': True, 'scopes': [], 'expires_at': 0}} if u.endswith('debug_token') else {'data': [{'id': 'f1', 'name': 'F'}]} if u.endswith('leadgen_forms') else {'data': [same]}):
            self.assertEqual(sync_connection(c), 1)
            self.assertEqual(sync_connection(c), 0)  # same provider id is never imported twice

    def test_expired_token_marks_connection_expired(self):
        self.connect('meta')
        c = AdConnection.objects.get(platform='meta')
        with mock.patch('leads.platforms.meta.refresh_status', side_effect=PlatformError('Session has expired', kind='auth')):
            sync_connection(c)
        c.refresh_from_db()
        self.assertEqual((c.status, c.error_message), ('expired', 'Session has expired'))
        self.assertEqual(sync_connection(c), 0)  # no more calls until reconnected

    def test_google_revoked_refresh_token(self):
        self.connect('google')
        c = AdConnection.objects.get(platform='google')
        c.token_expires_at = timezone.now()  # force a refresh
        c.save()
        with mock.patch('leads.platforms.google.http_json', side_effect=PlatformError('Token has been expired or revoked.', kind='revoked')):
            sync_connection(c)
        c.refresh_from_db()
        self.assertEqual(c.status, 'revoked')

    def test_disconnect_wipes_credentials(self):
        self.connect('google')
        c = AdConnection.objects.get(platform='google')
        self.assertEqual(self.client.post(f'/api/connections/{c.pk}/disconnect', **self.auth).status_code, 200)
        c.refresh_from_db()
        self.assertEqual((c.status, c.access_token_enc, c.refresh_token_enc, c.details), ('disconnected', '', '', {}))

    def test_meta_webhook_signature_and_realtime_import(self):
        self.connect('meta')
        payload = json.dumps({'entry': [{'id': 'p1', 'changes': [{'field': 'leadgen', 'value': {'leadgen_id': 'mock-meta-live', 'page_id': 'p1'}}]}]}).encode()
        bad = self.client.post('/api/meta/webhook', payload, content_type='application/json', HTTP_X_HUB_SIGNATURE_256='sha256=bad')
        self.assertEqual(bad.status_code, 403)
        sig = 'sha256=' + hmac.new(b'shh', payload, hashlib.sha256).hexdigest()
        ok = self.client.post('/api/meta/webhook', payload, content_type='application/json', HTTP_X_HUB_SIGNATURE_256=sig)
        self.assertEqual(len(ok.json()['created']), 1)
        self.assertEqual(self.client.get('/api/meta/webhook', {'hub.mode': 'subscribe', 'hub.verify_token': 'vt', 'hub.challenge': '42'}).content, b'42')

    def test_unconfigured_platform_cannot_start(self):
        with override_settings(AD_PLATFORMS_MOCK=False):
            self.assertEqual(self.client.post('/api/connections/google/start', **self.auth).status_code, 409)


@override_settings(AD_PLATFORMS_MOCK=True, PUBLIC_BASE_URL='http://testserver', FRONTEND_URL='http://testserver')
class SimulateTests(TestCase):
    def test_simulate_creates_lead_only_in_mock_mode(self):
        admin = User.objects.create_user('neha', password='x', role='Administrator')
        auth = {'HTTP_AUTHORIZATION': 'Bearer ' + signing.dumps({'uid': admin.pk}, salt='crm-token')}
        for p in ('meta', 'google'):
            url = self.client.post(f'/api/connections/{p}/start', **auth).json()['url']
            self.client.get(f'/api/connections/{p}/callback', {'code': 'c', 'state': parse_qs(urlparse(url).query)['state'][0]})
            before = Lead.objects.count()
            r = self.client.post(f'/api/connections/{AdConnection.objects.get(platform=p).pk}/simulate', **auth)
            self.assertEqual((r.status_code, len(r.json()['created'])), (200, 1))
            self.assertEqual(Lead.objects.count(), before + 1)
        with override_settings(AD_PLATFORMS_MOCK=False):
            self.assertEqual(self.client.post(f'/api/connections/{AdConnection.objects.first().pk}/simulate', **auth).status_code, 403)
