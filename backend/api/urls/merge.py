from django.urls import path
from api.views.merge import (
    contributor_stats_view,
    merge_contributions_view,
    contributors_by_category_view,
    contributors_effort_by_category_view,
    contributors_message_quality_view,
)


urlpatterns = [
    path("", merge_contributions_view, name="merge_contributions"),
    path(
        "contributors_by_category/",
        contributors_by_category_view,
        name="contributors_by_category",
    ),
    path(
        "contributor_stats/",
        contributor_stats_view,
        name="contributor_stats",
    ),
    path(
        "contributors_effort_by_category/",
        contributors_effort_by_category_view,
        name="contributors_effort_by_category",
    ),
    path(
        "contributors_message_quality/",
        contributors_message_quality_view,
        name="contributors_message_quality",
    ),
]
