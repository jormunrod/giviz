from django.contrib import admin
from django.urls import path, include, re_path
from drf_yasg import openapi

# Swagger / OpenAPI imports
from drf_yasg.views import get_schema_view
from rest_framework import permissions

from .views import welcome

schema_view = get_schema_view(
    openapi.Info(
        title="GIVIZ Backend API",
        default_version="v1",
        description="API for GIVIZ Backend, providing endpoints to analyze GitHub repositories.",
        contact=openapi.Contact(
            email="jorgemr@pm.me", name="@jormunrod", url="https://github.com/jormunrod"
        ),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("", welcome, name="welcome"),  # <--- ¡Aquí está el endpoint de bienvenida!
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    # Swagger/OpenAPI docs:
    re_path(
        r"^swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]
