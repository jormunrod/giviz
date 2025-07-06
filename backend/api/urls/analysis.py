from django.urls import path
from api.views.analysis import (
    classify_contributions,
    classify_contributions_percentages,
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
]
