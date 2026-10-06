"""Fake Meta + Google servers (AD_PLATFORMS_MOCK=1) so the whole connect → sync flow can be tried without real credentials."""
import itertools
import random
import time
import urllib.parse

_n = itertools.count(1)


def consent_url(platform, state, redirect_uri):
    q = urllib.parse.urlencode({'platform': platform, 'state': state, 'redirect_uri': redirect_uri})
    return f'/api/connections/mock-consent?{q}'


def _person():
    n = random.randint(100, 999)
    return {'name': f'Mock Lead {n}', 'phone': f'+91 97{n}0 2{n}1', 'email': f'mock{n}@example.in', 'company': f'Mock Industries {n}', 'city': 'Nashik'}


def respond(method, url, params, data, body, headers):
    u = url.split('?')[0]
    now = int(time.time())
    # ---- Meta
    if u.endswith('/oauth/access_token'):
        return {'access_token': 'mock-long' if params.get('grant_type') == 'fb_exchange_token' else 'mock-short', 'expires_in': 5184000}
    if u.endswith('/debug_token'):
        return {'data': {'is_valid': True, 'user_id': '1001', 'expires_at': now + 5184000, 'data_access_expires_at': now + 7776000,
                         'scopes': ['leads_retrieval', 'pages_show_list', 'pages_read_engagement', 'pages_manage_metadata', 'ads_read', 'business_management']}}
    if u.endswith('/me'):
        return {'id': '1001', 'name': 'Demo Owner'}
    if u.endswith('/me/accounts'):
        return {'data': [{'id': 'p1', 'name': 'ABC Industries (Page)', 'access_token': 'mock-page-1'}, {'id': 'p2', 'name': 'ABC Retail (Page)', 'access_token': 'mock-page-2'}]}
    if u.endswith('/me/adaccounts'):
        return {'data': [{'account_id': '5550001', 'name': 'ABC Main Ad Account', 'currency': 'INR', 'business': {'id': 'b1', 'name': 'ABC Company'}},
                         {'account_id': '5550002', 'name': 'ABC Retail Ads', 'currency': 'INR', 'business': {'id': 'b1', 'name': 'ABC Company'}}]}
    if u.endswith('/subscribed_apps') or u.endswith('/me/permissions'):
        return {'success': True}
    if u.endswith('/leadgen_forms'):
        return {'data': [{'id': 'f1', 'name': 'ERP enquiry form'}]}
    if u.endswith('/leads'):
        p = _person()
        fd = [{'name': 'full_name', 'values': [p['name']]}, {'name': 'phone_number', 'values': [p['phone']]}, {'name': 'email', 'values': [p['email']]},
              {'name': 'company_name', 'values': [p['company']]}, {'name': 'city', 'values': [p['city']]}]
        return {'data': [{'id': f'mock-meta-{next(_n)}-{now}', 'created_time': 'now', 'platform': random.choice(['fb', 'ig']), 'campaign_name': 'Diwali ERP Offer', 'field_data': fd}]}
    if '/v' in u and u.rsplit('/', 1)[-1].startswith('mock-meta'):  # single lead fetch from a webhook
        p = _person()
        return {'id': u.rsplit('/', 1)[-1], 'platform': 'fb', 'campaign_name': 'Diwali ERP Offer',
                'field_data': [{'name': 'full_name', 'values': [p['name']]}, {'name': 'phone_number', 'values': [p['phone']]}]}
    # ---- Google
    if u == 'https://oauth2.googleapis.com/token':
        r = {'access_token': 'mock-g-access', 'expires_in': 3599, 'scope': 'https://www.googleapis.com/auth/adwords openid email'}
        if data.get('grant_type') == 'authorization_code':
            r['refresh_token'] = 'mock-g-refresh'
        return r
    if u == 'https://oauth2.googleapis.com/revoke':
        return {}
    if u.endswith('/userinfo'):
        return {'email': 'owner@abc-company.in'}
    if u.endswith('customers:listAccessibleCustomers'):
        return {'resourceNames': ['customers/1234567890', 'customers/9876543210']}
    if u.endswith('googleAds:search'):
        q = (body or {}).get('query', '')
        if 'FROM customer' in q:
            cid = u.split('/customers/')[1].split('/')[0]
            return {'results': [{'customer': {'id': cid, 'descriptiveName': 'ABC Company Search Ads' if cid == '1234567890' else 'ABC Manager', 'manager': cid != '1234567890', 'currencyCode': 'INR'}}]}
        if 'FROM campaign' in q:
            return {'results': [{'campaign': {'resourceName': 'customers/1234567890/campaigns/77', 'name': 'Search – ERP Software'}}]}
        p = _person()
        f = [{'fieldType': 'FULL_NAME', 'fieldValue': p['name']}, {'fieldType': 'EMAIL', 'fieldValue': p['email']}, {'fieldType': 'PHONE_NUMBER', 'fieldValue': p['phone']},
             {'fieldType': 'COMPANY_NAME', 'fieldValue': p['company']}, {'fieldType': 'CITY', 'fieldValue': p['city']}]
        return {'results': [{'leadFormSubmissionData': {'id': f'mock-g-{next(_n)}-{now}', 'campaign': 'customers/1234567890/campaigns/77', 'leadFormSubmissionFields': f,
                                                        'customLeadFormSubmissionFields': [{'questionText': 'What do you need?', 'fieldValue': 'ERP Software'}]}}]}
    return {}
