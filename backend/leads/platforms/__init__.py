"""Platform adapters share one shape: configured(), authorize_url(), connect(), refresh_status(), select(), disconnect(), sync()."""
from . import google, meta

PLATFORMS = {'meta': meta, 'google': google}
