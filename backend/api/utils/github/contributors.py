import json
import os
from typing import Dict, List

import requests

from api.utils.common.save import save_repo_data

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_URL = os.getenv("GITHUB_API_URL", "https://api.github.com/graphql")

if not GITHUB_TOKEN:
    raise RuntimeError("GITHUB_TOKEN is not set in the environment")


def fetch_contributors(owner: str, repo: str, first: int = 100) -> List[Dict]:
    """Fetch contributors from a GitHub repository using the GraphQL API.
    Returns a list of contributors as dictionaries.
    """
    query = """
    query($owner: String!, $name: String!, $after: String, $first: Int!) {
      repository(owner: $owner, name: $name) {
        mentionableUsers(first: $first, after: $after) {
          nodes {
            login
            name
            avatarUrl
            url
            bio
            company
            location
            email
            createdAt
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
    """
    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
    variables = {"owner": owner, "name": repo, "after": None, "first": first}
    results = []
    while True:
        response = requests.post(
            GITHUB_API_URL,
            json={"query": query, "variables": variables},
            headers=headers,
        )
        response.raise_for_status()
        data = response.json()
        if "errors" in data:
            raise RuntimeError(f"GraphQL error: {data['errors']}")
        if "data" not in data or not data["data"].get("repository"):
            raise RuntimeError(
                f"Unexpected response structure:\n{
                    json.dumps(
                        data, indent=2)}", )
        try:
            users = data["data"]["repository"]["mentionableUsers"]["nodes"]
            page_info = data["data"]["repository"]["mentionableUsers"]["pageInfo"]
        except KeyError as e:
            raise RuntimeError(f"Unexpected response structure: {e}")
        results.extend(users)
        if not page_info["hasNextPage"]:
            break
        variables["after"] = page_info["endCursor"]
    return results


def save_contributors(owner: str, repo: str, contributors: List[Dict]) -> None:
    """Save contributors to a JSON file in the persistent data directory.
    """
    save_repo_data(owner, repo, contributors, "contributors.json")
