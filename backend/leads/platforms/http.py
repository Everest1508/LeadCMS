import json
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings


class PlatformError(Exception):
    """kind: 'auth' = token expired/invalid, 'revoked' = user removed our access, 'error' = anything else."""
    def __init__(self, msg, kind='error', code=None):
        super().__init__(msg)
        self.kind, self.code = kind, code


def http_json(method, url, *, params=None, data=None, json_body=None, headers=None, timeout=20):
    """Tiny JSON HTTP client. Raises PlatformError with the provider's own message on HTTP errors."""
    if settings.AD_PLATFORMS_MOCK:
        from . import mock
        return mock.respond(method, url, params or {}, data or {}, json_body, headers or {})
    if params:
        url += ('&' if '?' in url else '?') + urllib.parse.urlencode(params)
    body, hdrs = None, dict(headers or {})
    if json_body is not None:
        body, hdrs['Content-Type'] = json.dumps(json_body).encode(), 'application/json'
    elif data is not None:
        body = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read() or b'{}')
        except ValueError:
            payload = {}
        raise PlatformError(error_message(payload) or f'HTTP {e.code}', kind=error_kind(e.code, payload), code=e.code)
    except urllib.error.URLError as e:
        raise PlatformError(f'Network error: {e.reason}')


def error_message(p):
    e = p.get('error')
    if isinstance(e, dict):  # Meta + Google Ads style
        return e.get('message') or e.get('status') or ''
    return p.get('error_description') or (e if isinstance(e, str) else '')  # Google OAuth style


def error_kind(status, p):
    e = p.get('error')
    if isinstance(e, dict):
        if e.get('code') == 190:  # Meta: invalid/expired token. Subcode 458 = app removed by the user
            return 'revoked' if e.get('error_subcode') in (458, 459) else 'auth'
        if status == 401 or e.get('status') == 'UNAUTHENTICATED':
            return 'auth'
    if e == 'invalid_grant':  # Google: refresh token revoked or expired
        return 'revoked'
    return 'error'
