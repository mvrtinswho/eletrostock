from django.urls import path
from . import views
urlpatterns = [
 path("", views.dashboard, name="dashboard"),
 path("<slug:section>/", views.listing, name="listing"),
 path("<slug:section>/novo/", views.edit, name="create"),
 path("<slug:section>/<int:pk>/", views.detail, name="detail"),
 path("<slug:section>/<int:pk>/editar/", views.edit, name="edit"),
]
