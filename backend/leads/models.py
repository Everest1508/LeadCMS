from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    ROLES = [('Administrator',) * 2, ('Sales Manager',) * 2, ('Salesperson',) * 2]
    role = models.CharField(max_length=20, choices=ROLES, default='Salesperson')

    @property
    def name(self):
        return self.get_full_name() or self.username


class Lead(models.Model):
    # Lead ID shown in the UI is "L-<number>"; numbers start at 1001.
    number = models.PositiveIntegerField(unique=True, editable=False)
    name = models.CharField(max_length=120)
    company = models.CharField(max_length=160, blank=True)
    email = models.CharField(max_length=160, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    location = models.CharField(max_length=120, blank=True)
    requirement = models.CharField(max_length=240, blank=True)
    source = models.CharField(max_length=30)
    campaign = models.CharField(max_length=160, blank=True)
    received_at = models.DateTimeField(default=timezone.now)
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='leads')
    assigned_by = models.CharField(max_length=120, blank=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, default='New')
    priority = models.CharField(max_length=10, default='Warm')
    value = models.PositiveIntegerField(default=0)
    verification = models.JSONField(default=dict)  # {checks, result, by, at, note}
    raw = models.JSONField(default=dict, blank=True)  # original payload from the source, for debugging
    external_id = models.CharField(max_length=120, blank=True, db_index=True)  # provider's lead id, makes syncing idempotent

    class Meta:
        ordering = ['-received_at']

    @property
    def code(self):
        return f'L-{self.number}'

    def save(self, *a, **kw):
        if not self.number:
            self.number = (Lead.objects.aggregate(m=models.Max('number'))['m'] or 1000) + 1
        super().save(*a, **kw)


class Activity(models.Model):
    """Timeline entry and audit trail in one table."""
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='activities')
    type = models.CharField(max_length=20)  # Call/Email/Meeting/WhatsApp/Note/Follow-up/System
    at = models.DateTimeField(default=timezone.now)
    user = models.CharField(max_length=120, default='System')
    description = models.TextField()
    due = models.DateTimeField(null=True, blank=True)
    done = models.BooleanField(default=False)

    class Meta:
        ordering = ['-at', '-id']


class Notification(models.Model):
    text = models.CharField(max_length=240)
    lead = models.ForeignKey(Lead, null=True, blank=True, on_delete=models.CASCADE)
    at = models.DateTimeField(default=timezone.now)
    read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-at', '-id']


class SourceConfig(models.Model):
    name = models.CharField(max_length=30, primary_key=True)
    enabled = models.BooleanField(default=True)


def _token():
    import secrets
    return secrets.token_urlsafe(24)


def _secret():
    import secrets
    return secrets.token_urlsafe(10)


class Webhook(models.Model):
    """An inbound lead endpoint an admin creates in the CRM. The URL token is the credential."""
    KINDS = [('website', 'Website form'), ('meta', 'Meta Ads'), ('google', 'Google Ads')]
    name = models.CharField(max_length=80)
    kind = models.CharField(max_length=10, choices=KINDS)
    token = models.CharField(max_length=60, unique=True, default=_token)
    secret = models.CharField(max_length=40, default=_secret)  # Meta verify token / Google lead-form key
    campaign = models.CharField(max_length=120, blank=True)  # default campaign label when a payload has none
    enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ['-created_at']


class Delivery(models.Model):
    """One request received on a webhook, kept so admins can debug integrations."""
    webhook = models.ForeignKey(Webhook, on_delete=models.CASCADE, related_name='deliveries')
    at = models.DateTimeField(default=timezone.now)
    ok = models.BooleanField(default=True)
    message = models.CharField(max_length=240, blank=True)
    leads = models.CharField(max_length=120, blank=True)  # created lead codes
    test = models.BooleanField(default=False)
    payload = models.TextField(blank=True)

    class Meta:
        ordering = ['-at', '-id']


class AdConnection(models.Model):
    """A connected advertising account (one per platform in this single-tenant prototype).
    Tokens are stored encrypted; use the `access_token` / `refresh_token` properties."""
    PLATFORMS = [('meta', 'Meta Ads'), ('google', 'Google Ads')]
    STATUSES = ['active', 'expiring', 'expired', 'revoked', 'error', 'disconnected']
    platform = models.CharField(max_length=10, choices=PLATFORMS, unique=True)
    external_id = models.CharField(max_length=60, blank=True)  # Meta ad account id / Google customer id (selected)
    account_name = models.CharField(max_length=160, blank=True)
    business_id = models.CharField(max_length=60, blank=True)
    business_name = models.CharField(max_length=160, blank=True)
    access_token_enc = models.TextField(blank=True)
    refresh_token_enc = models.TextField(blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    scopes = models.JSONField(default=list)
    details = models.JSONField(default=dict)  # accounts/pages/customers seen at connect time; page tokens inside are encrypted
    connected_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=14, default='active')
    error_message = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_sync_count = models.PositiveIntegerField(default=0)

    @property
    def access_token(self):
        from .platforms.crypto import decrypt
        return decrypt(self.access_token_enc)

    @access_token.setter
    def access_token(self, v):
        from .platforms.crypto import encrypt
        self.access_token_enc = encrypt(v or '')

    @property
    def refresh_token(self):
        from .platforms.crypto import decrypt
        return decrypt(self.refresh_token_enc)

    @refresh_token.setter
    def refresh_token(self, v):
        from .platforms.crypto import encrypt
        self.refresh_token_enc = encrypt(v or '')

    @property
    def usable(self):
        return self.status in ('active', 'expiring')
