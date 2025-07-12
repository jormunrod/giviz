from django.urls import path
from api.views.merge import merge_contributions_view

urlpatterns = [
    path("", merge_contributions_view, name="merge_contributions"),
]
