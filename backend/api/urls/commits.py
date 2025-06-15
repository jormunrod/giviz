from django.urls import path
from api.views import commits

urlpatterns = [
    path("extract/", commits.extract_commits, name="extract_commits_git"),
]
