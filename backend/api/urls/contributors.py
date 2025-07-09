from django.urls import path

from api.views import contributors

urlpatterns = [
    path(
        "extract/",
        contributors.extract_contributors_graphql,
        name="extract_contributors_graphql",
    ),
    path("", contributors.get_contributors, name="get_contributors"),
    path("single/", contributors.get_contributor, name="get_contributor"),
]
