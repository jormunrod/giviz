import os

import requests
from dotenv import load_dotenv
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.utils.git_commits import (
    clone_or_update_repo,
    analyze_commits,
    save_commits,
)

load_dotenv()
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_URL = "https://api.github.com/graphql"


# --- Serializers ---
class RepoQuerySerializer(serializers.Serializer):
    owner = serializers.CharField(help_text="Repository owner (user or org)")
    repo = serializers.CharField(help_text="Repository name")
    depth = serializers.IntegerField(
        required=False,
        min_value=0,
        default=0,
        help_text="Depth of clone (optional). If not set, defaults to None and clones entire history.",
    )


# --- Endpoints ---


@swagger_auto_schema(
    method="get",
)
@api_view(["GET"])
def ping(request):
    """Simple endpoint to check if the API is running."""
    return Response({"status": "ok"})


@swagger_auto_schema(
    method="get",
    query_serializer=RepoQuerySerializer(),
)
@api_view(["GET"])
def check_repo(request):
    """
    Check if a GitHub repository exists and is accessible.
    """
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
        {"exists": True, "name": repo_data["name"], "private": repo_data["isPrivate"]}
    )


@swagger_auto_schema(
    method="post",
    request_body=RepoQuerySerializer,
)
@api_view(["POST"])
def analyze_repo(request):
    """
    Analyze a GitHub repository and extract commit data.
    """
    serializer = RepoQuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": "Missing or invalid parameters", "detail": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    git_url = f"https://github.com/{owner}/{repo}.git"

    try:
        depth = serializer.validated_data.get("depth", 0)
        if depth == 0:
            depth = None

        # Clona o actualiza el repo
        clone_or_update_repo(git_url, owner, repo, depth=depth)
        # Analiza los commits
        commits = analyze_commits(owner, repo)
        # Guarda los commits (como commits.json en el repo cache)
        save_commits(owner, repo, commits)

    except Exception as e:
        return Response(
            {"error": "Repository analysis failed", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"status": "ok"})
