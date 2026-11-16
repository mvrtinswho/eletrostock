from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth
from django.contrib.admin.forms import AdminAuthenticationForm
urlpatterns = [
 path("admin/", admin.site.urls),
 path("entrar/", auth.LoginView.as_view(template_name="registration/login.html", authentication_form=AdminAuthenticationForm), name="login"),
 path("sair/", auth.LogoutView.as_view(), name="logout"),
 path("api/v1/", include("estoque.api_urls")),
 path("", include("estoque.urls")),
]
