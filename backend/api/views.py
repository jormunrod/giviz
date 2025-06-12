import os
from django.http import JsonResponse
import requests
from dotenv import load_dotenv

load_dotenv()
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_URL = "https://api.github.com/graphql"


def ping(request):
    """
    Simple endpoint to check if the API is running.

    Returns:
        JsonResponse: {"status": "ok"}
    """
    return JsonResponse({"status": "ok"})


def check_repo(request):
    """
    Checks if a GitHub repository exists and is accessible.

    Query Parameters:
        owner (str): Repository owner (user or org).
        repo (str): Repository name.

    Returns:
        JsonResponse: {
            exists: bool,
            name: str,
            private: bool
        } or error message.
    """
    owner = request.GET.get("owner")
    repo = request.GET.get("repo")

    if not owner or not repo:
        return JsonResponse(
            {"error": "Missing 'owner' or 'repo' parameter"}, status=400
        )

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
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": "GitHub API error", "detail": str(e)}, status=502)

    data = response.json()

    if "errors" in data or not data.get("data", {}).get("repository"):
        return JsonResponse({"exists": False}, status=404)

    repo_data = data["data"]["repository"]

    return JsonResponse(
        {"exists": True, "name": repo_data["name"], "private": repo_data["isPrivate"]}
    )
