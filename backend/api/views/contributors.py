from collections import defaultdict

from drf_yasg.utils import swagger_auto_schema
from rest_framework import serializers
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.serializers.repo import RepoQuerySerializer
from api.utils.common.prepare_data import prepare_contributors
from api.utils.common.save import load_repo_data
from api.utils.github.contributors import fetch_contributors, save_contributors


class ContributorQuerySerializer(RepoQuerySerializer):
    username = serializers.CharField(help_text="Contributor username or login")


@swagger_auto_schema(method="post", request_body=RepoQuerySerializer)
@api_view(["POST"])
def extract_contributors_graphql(request):
    """Extract contributors from GitHub using GraphQL and save them locally."""
    serializer = RepoQuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]

    try:
        contributors = fetch_contributors(owner, repo)
        save_contributors(owner, repo, contributors)
        return Response({"status": "ok", "n_contributors": len(contributors)})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


def _resolve_by_identity(
    login=None, name=None, email=None, *, name_map, email_map, login_map
):
    if login:
        normalized = login.lower()
        if normalized in login_map:
            return login_map[normalized]
    if email:
        normalized = email.lower()
        if normalized in email_map:
            return email_map[normalized]
    if name:
        normalized = name.lower()
        if normalized in name_map:
            return name_map[normalized]
    return None


def _compute_contribution_totals(owner, repo, contributors):
    commits = load_repo_data(owner, repo, "commits.json") or []
    issues = load_repo_data(owner, repo, "issues.json") or []
    pulls = load_repo_data(owner, repo, "pulls.json") or []

    name_map = {}
    email_map = {}
    login_map = {}

    for contributor in contributors:
        login = contributor.get("login")
        if not login:
            continue
        normalized_login = login.lower()
        login_map[normalized_login] = login
        name = contributor.get("name")
        if name:
            name_map.setdefault(name.lower(), login)
        email = contributor.get("email")
        if email:
            email_map.setdefault(email.lower(), login)

    totals = defaultdict(lambda: {"commits": 0, "issues": 0, "pulls": 0})

    for commit in commits:
        login = _resolve_by_identity(
            name=commit.get("author"),
            email=commit.get("email"),
            login=commit.get("login"),
            name_map=name_map,
            email_map=email_map,
            login_map=login_map,
        )
        if login:
            totals[login]["commits"] += 1

    for issue in issues:
        author = issue.get("author")
        login = None
        if isinstance(author, dict):
            login = _resolve_by_identity(
                login=author.get("login"),
                name_map=name_map,
                email_map=email_map,
                login_map=login_map,
            )
        else:
            login = _resolve_by_identity(
                login=author,
                name=author,
                name_map=name_map,
                email_map=email_map,
                login_map=login_map,
            )
        if login:
            totals[login]["issues"] += 1

    for pull in pulls:
        author = pull.get("author")
        login = None
        if isinstance(author, dict):
            login = _resolve_by_identity(
                login=author.get("login"),
                name_map=name_map,
                email_map=email_map,
                login_map=login_map,
            )
        else:
            login = _resolve_by_identity(
                login=author,
                name=author,
                name_map=name_map,
                email_map=email_map,
                login_map=login_map,
            )
        if login:
            totals[login]["pulls"] += 1

    result = {}
    for login, counts in totals.items():
        total = counts["commits"] + counts["issues"] + counts["pulls"]
        result[login] = {
            "commits": counts["commits"],
            "issues": counts["issues"],
            "pulls": counts["pulls"],
            "total": total,
        }
    return result


@swagger_auto_schema(method="get", query_serializer=RepoQuerySerializer)
@api_view(["GET"])
def get_contributors(request):
    """Get saved contributors for a given repository."""
    serializer = RepoQuerySerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    contributors = load_repo_data(owner, repo, "contributors.json")
    if contributors is None:
        return Response({"error": "No contributors found for this repo."}, status=404)
    contribution_totals = _compute_contribution_totals(owner, repo, contributors)
    contributors = prepare_contributors(contributors)
    for contributor in contributors:
        login = contributor.get("login")
        totals = contribution_totals.get(
            login, {"commits": 0, "issues": 0, "pulls": 0, "total": 0}
        )
        contributor["commits_count"] = totals["commits"]
        contributor["issues_count"] = totals["issues"]
        contributor["pulls_count"] = totals["pulls"]
        contributor["contributions_total"] = totals["total"]
    contributors.sort(
        key=lambda c: (
            -(c.get("contributions_total") or 0),
            (c.get("login") or c.get("name") or "").lower(),
        )
    )
    return Response({"contributors": contributors, "n_contributors": len(contributors)})


@swagger_auto_schema(method="get", query_serializer=ContributorQuerySerializer)
@api_view(["GET"])
def get_contributor(request):
    """Get a single contributor by username/login for a given repository."""
    serializer = ContributorQuerySerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(
            {"error": "Missing or invalid parameters."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    username = serializer.validated_data["username"]
    contributors = load_repo_data(owner, repo, "contributors.json")
    if contributors is None:
        return Response({"error": "No contributors found for this repo."}, status=404)
    contribution_totals = _compute_contribution_totals(owner, repo, contributors)
    contributors = prepare_contributors(contributors)
    contributor = next(
        (
            c
            for c in contributors
            if c.get("login") == username
            or c.get("username") == username
            or c.get("name") == username
        ),
        None,
    )
    if not contributor:
        return Response({"error": "Contributor not found."}, status=404)
    totals = contribution_totals.get(
        contributor.get("login"),
        {"commits": 0, "issues": 0, "pulls": 0, "total": 0},
    )
    contributor["commits_count"] = totals["commits"]
    contributor["issues_count"] = totals["issues"]
    contributor["pulls_count"] = totals["pulls"]
    contributor["contributions_total"] = totals["total"]
    return Response({"contributor": contributor})
