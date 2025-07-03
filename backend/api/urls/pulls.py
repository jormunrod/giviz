from django.urls import path
from api.views import pulls

urlpatterns = [
    path("extract/", pulls.extract_pulls_graphql, name="extract_pulls_graphql"),
    path("", pulls.get_pulls, name="get_pulls"),
]
