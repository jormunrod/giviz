from django.urls import path
from api.views.merge import (
    merge_contributions_view,
    contributors_by_category_view,
    contributors_effort_by_category_view,
    # contributors_message_quality_view,
)


urlpatterns = [
    path("", merge_contributions_view, name="merge_contributions"),
    path(
        "contributors_by_category/",
        contributors_by_category_view,
        name="contributors_by_category",
    ),
    path(
        "contributors_effort_by_category/",
        contributors_effort_by_category_view,
        name="contributors_effort_by_category",
    ),
    path(
        "contributors_message_quality/",
        contributors_by_category_view,  # Reusing the same view for now
        name="contributors_message_quality",
    ),
]
