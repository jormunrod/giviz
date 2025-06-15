from django.urls import path
from api.views import repo

urlpatterns = [
    path("check/", repo.check_repo, name="check_repo"),
]
