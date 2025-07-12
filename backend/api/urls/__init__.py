from django.urls import include, path

from api.views import health

urlpatterns = [
    path("ping/", health.ping, name="ping"),
    path("commits/", include("api.urls.commits")),
    path("issues/", include("api.urls.issues")),
    path("pulls/", include("api.urls.pulls")),
    path("contributors/", include("api.urls.contributors")),
    path("repo/", include("api.urls.repo")),
    path("analysis/", include("api.urls.analysis")),
    path("merge/", include("api.urls.merge")),
]
