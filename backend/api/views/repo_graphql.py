import os
import requests
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.serializers.repo import RepoQuerySerializer

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
        {
            "status": "ok",
            "data": {
                "exists": True,
                "name": repo_data["name"],
                "private": repo_data["isPrivate"],
            },
        }
    )
