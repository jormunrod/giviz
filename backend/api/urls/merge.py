from django.urls import path
from api.views.merge import merge_contributions_view, contributors_by_category_view

urlpatterns = [
    path("", merge_contributions_view, name="merge_contributions"),
    path(
        "contributors_by_category/",
        contributors_by_category_view,
        name="contributors_by_category",
    ),
]
