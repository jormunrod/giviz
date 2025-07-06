from django.urls import path
from api.views.analysis import classify_contributions

urlpatterns = [
    path("classify_contributions/", classify_contributions, name="classify_contributions"),
]
