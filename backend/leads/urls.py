from django.urls import path

from . import connect_views as c
from . import views as v

urlpatterns = [
    path('auth/login', v.login),
    path('state', v.state),
    path('leads', v.leads),
    path('leads/<str:code>/verify', v.verify),
    path('leads/<str:code>/assign', v.assign),
    path('leads/<str:code>/status', v.set_status),
    path('leads/<str:code>/activities', v.add_activity),
    path('leads/<str:code>/activities/<int:pk>/done', v.finish_followup),
    path('notifications/read', v.read_all),
    path('reset', v.reset),
    path('sources/<str:name>/toggle', v.toggle_source),
    path('hooks/<str:token>', v.hook),
    path('webhooks', v.webhooks),
    path('webhooks/<int:pk>/<str:action>', v.webhook_action),
    path('simulate', v.simulate),
    path('connections', c.connections),
    path('connections/mock-consent', c.mock_consent),
    path('connections/<int:pk>/select', c.select),
    path('connections/<int:pk>/disconnect', c.disconnect),
    path('connections/<int:pk>/sync', c.sync_now),
    path('connections/<int:pk>/recheck', c.recheck),
    path('connections/<int:pk>/simulate', c.simulate),
    path('connections/<str:platform>/start', c.start),
    path('connections/<str:platform>/callback', c.callback),
    path('meta/webhook', c.meta_webhook),
    path('meta/deauthorize', c.meta_deauthorize),
]
