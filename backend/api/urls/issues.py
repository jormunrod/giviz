from django.urls import path
from api.views import issues

urlpatterns = [
    path("extract/", issues.extract_issues_graphql, name="extract_issues_graphql"),
]
