from django.urls import path

from api.views import health, repo_git, repo_graphql

urlpatterns = [
    path("ping/", health.ping, name="ping"),
    path("commits/git/", repo_git.extract_commits, name="extract_commits_from_git"),
    path("repo/check/", repo_graphql.check_repo, name="check_repo_via_graphql"),
]
