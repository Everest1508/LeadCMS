import time

from django.core.management.base import BaseCommand

from leads.sync import sync_all


class Command(BaseCommand):
    help = 'Import new leads from connected Meta/Google ad accounts. Use --loop N to run forever (or schedule it with cron).'

    def add_arguments(self, p):
        p.add_argument('--loop', type=int, default=0, help='repeat every N seconds')

    def handle(self, *a, loop=0, **kw):
        while True:
            self.stdout.write(f'synced: {sync_all()}')
            if not loop:
                return
            time.sleep(loop)
