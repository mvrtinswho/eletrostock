from django.urls import path
from . import api
urlpatterns = [
    path("health/", api.health),
    path("auth/login/", api.login),
    path("auth/logout/", api.logout),
    path("auth/me/", api.me),
    path("dashboard/", api.dashboard),
    path("<slug:section>/", api.resource),
    path("<slug:section>/<int:pk>/", api.resource),
]
