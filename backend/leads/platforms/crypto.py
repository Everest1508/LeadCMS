"""Encrypt tokens at rest. CRM_ENCRYPTION_KEY may hold several comma-separated keys: first encrypts, all decrypt (key rotation)."""
import base64
import hashlib

from cryptography.fernet import Fernet, MultiFernet
from django.conf import settings


def _fernet():
    keys = [k.strip() for k in settings.CRM_ENCRYPTION_KEY.split(',') if k.strip()]
    if not keys:  # dev fallback derived from SECRET_KEY; production must set CRM_ENCRYPTION_KEY
        keys = [base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest()).decode()]
    return MultiFernet([Fernet(k) for k in keys])


def encrypt(text: str) -> str:
    return _fernet().encrypt(text.encode()).decode() if text else ''


def decrypt(blob: str) -> str:
    return _fernet().decrypt(blob.encode()).decode() if blob else ''
