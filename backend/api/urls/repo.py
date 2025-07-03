from django.urls import path
from api.views import repo

urlpatterns = [
    path("check/", repo.check_repo, name="check_repo"),
    path("extract_all/", repo.extract_all_data, name="extract_all_data"),
]
