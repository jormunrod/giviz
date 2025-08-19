from django.urls import path
from api.views.analysis import (
    classify_contributions,
    classify_contributions_percentages,
    analyze_message_quality,
)

urlpatterns = [
    path(
        "classify_contributions/", classify_contributions, name="classify_contributions"
    ),
    path(
        "classify_contributions_percentages/",
        classify_contributions_percentages,
        name="classify_contributions_percentages",
    ),
    path(
        "analyze_message_quality/",
        analyze_message_quality,
        name="analyze_message_quality",
    ),
]
