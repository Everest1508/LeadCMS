"""Pull leads from connected ad accounts. Idempotent: a provider lead id is only ever imported once."""
from datetime import timedelta

from django.utils import timezone

from . import services as svc
from .models import AdConnection, Lead
from .platforms import PLATFORMS
from .platforms.http import PlatformError


def mark_failed(conn, e):
    """Translate a provider error into a connection status the UI can explain."""
    conn.status = {'auth': 'expired', 'revoked': 'revoked'}.get(e.kind, 'error')
    conn.error_message = str(e)[:300]
    conn.save()
    svc.notify(f'{PLATFORMS[conn.platform].LABEL} connection needs attention: {conn.error_message}')


def import_lead(fields):
    """Create the lead unless this provider id was imported before. Returns the lead or None."""
    ext = fields['external_id']
    if Lead.objects.filter(external_id=ext).exists():
        return None
    source = fields.pop('source')
    return svc.create_lead(source, **{k: (v if k in ('raw', 'external_id') else (v or '')[:240]) for k, v in fields.items()})


def sync_connection(conn):
    """Returns the number of new leads. Never raises: failures are recorded on the connection."""
    if not conn.usable or not conn.external_id and conn.platform == 'google':
        return 0
    adapter = PLATFORMS[conn.platform]
    since = (conn.last_sync_at or timezone.now() - timedelta(days=30)) - timedelta(minutes=10)  # overlap, dedupe makes it safe
    started = timezone.now()
    try:
        if conn.platform == 'meta':
            adapter.refresh_status(conn)
        fresh = [l for l in (import_lead(f) for f in adapter.sync(conn, since)) if l]
    except PlatformError as e:
        mark_failed(conn, e)
        return 0
    conn.last_sync_at, conn.last_sync_count = started, len(fresh)
    if conn.status == 'error':
        conn.status, conn.error_message = 'active', ''
    conn.save()
    return len(fresh)


def sync_all():
    return {c.platform: sync_connection(c) for c in AdConnection.objects.exclude(status__in=('disconnected', 'revoked'))}
