from django.urls import path

from . import views

urlpatterns = [
    path("ping/", views.ping, name="ping"),
    path("check-repo/", views.check_repo, name="check_repo"),
    path("analyze-repo/", views.analyze_repo, name="analyze_repo"),
]
