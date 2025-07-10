import os

import requests
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.serializers.repo import (
    RepoQuerySerializer,
    RepoQueryWithDepthSerializer,
    RepoQueryWithLimitsSerializer,
)
from api.utils.git.commits import analyze_commits, save_commits
from api.utils.git.repo import clone_or_update_repo
from api.utils.github.contributors import fetch_contributors, save_contributors
from api.utils.github.issues import fetch_issues, save_issues
from api.utils.github.pulls import fetch_pulls, save_pulls

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    raise ValueError("GITHUB_TOKEN environment variable is not set")
GITHUB_API_URL = os.getenv("GITHUB_API_URL", "https://api.github.com/graphql")


@swagger_auto_schema(
    method="get",
    query_serializer=RepoQuerySerializer(),
)
@api_view(["GET"])
def check_repo(request):
    """Check if a GitHub repository exists and is accessible."""
    serializer = RepoQuerySerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {"error": "Missing or invalid parameters", "detail": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]

    query = """
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        name
        isPrivate
      }
    }
    """

    variables = {"owner": owner, "name": repo}
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            GITHUB_API_URL,
            json={"query": query, "variables": variables},
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        return Response(
            {"error": "GitHub API error", "detail": str(e)},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if "errors" in data or not data.get("data", {}).get("repository"):
        return Response({"exists": False}, status=status.HTTP_404_NOT_FOUND)

    repo_data = data["data"]["repository"]
    return Response(
        {
            "status": "ok",
            "data": {
                "exists": True,
                "name": repo_data["name"],
                "private": repo_data["isPrivate"],
            },
        },
    )


@swagger_auto_schema(method="post", request_body=RepoQueryWithLimitsSerializer)
@api_view(["POST"])
def extract_all_data(request):
    """Extract and save all data (commits, issues, pulls, contributors) for a repo."""
    serializer = RepoQueryWithLimitsSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    depth = serializer.validated_data.get("depth", 0)
    if depth == 0:
        depth = None
    max_commits = serializer.validated_data.get("max_commits", 50)
    max_issues = serializer.validated_data.get("max_issues", 50)
    max_pulls = serializer.validated_data.get("max_pulls", 50)
    summary = {}
    errors = {}
    # Commits
    try:
        git_url = f"https://github.com/{owner}/{repo}.git"
        clone_or_update_repo(git_url, owner, repo, depth=depth)
        commits = analyze_commits(owner, repo)
        commits = commits[:max_commits]
        save_commits(owner, repo, commits)
        summary["commits"] = len(commits)
    except Exception as e:
        errors["commits"] = str(e)
    # Issues
    try:
        issues = fetch_issues(owner, repo, first=max_issues)
        save_issues(owner, repo, issues)
        summary["issues"] = len(issues)
    except Exception as e:
        errors["issues"] = str(e)
    # Pulls
    try:
        pulls = fetch_pulls(owner, repo, first=max_pulls)
        save_pulls(owner, repo, pulls)
        summary["pulls"] = len(pulls)
    except Exception as e:
        errors["pulls"] = str(e)
    # Contributors
    try:
        contributors = fetch_contributors(owner, repo)
        save_contributors(owner, repo, contributors)
        summary["contributors"] = len(contributors)
    except Exception as e:
        errors["contributors"] = str(e)
    return Response({"status": "ok", "summary": summary, "errors": errors})
