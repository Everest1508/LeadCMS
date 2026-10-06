import os
import sys
import threading
import time

from django.apps import AppConfig


class LeadsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'leads'

    def ready(self):
        """AD_SYNC_INTERVAL=300 makes `runserver` also pull leads from connected ad accounts every 300 s.
        In production prefer a separate worker: `manage.py sync_ads --loop 300`."""
        secs = int(os.environ.get('AD_SYNC_INTERVAL') or 0)
        if not secs or 'runserver' not in sys.argv or os.environ.get('RUN_MAIN') == 'false':
            return

        def loop():
            from .sync import sync_all
            time.sleep(5)
            while True:
                try:
                    sync_all()
                except Exception:  # never let the thread die
                    pass
                time.sleep(secs)
        threading.Thread(target=loop, daemon=True, name='ad-sync').start()
