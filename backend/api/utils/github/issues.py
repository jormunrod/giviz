import os
import json
from typing import List, Dict

import requests

from api.utils.common.save import save_repo_data

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_URL = os.getenv("GITHUB_API_URL", "https://api.github.com/graphql")

if not GITHUB_TOKEN:
    raise RuntimeError("GITHUB_TOKEN is not set in the environment")


def fetch_issues(owner: str, repo: str, first: int = 100) -> List[Dict]:
    """
    Fetch all issues from a GitHub repository using the GraphQL API.

    Returns:
        A list of issues as dictionaries.
    """
    query = """
    query($owner: String!, $name: String!, $after: String, $first: Int!) {
      repository(owner: $owner, name: $name) {
        issues(first: $first, after: $after, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            number
            title
            body
            createdAt
            closedAt
            author {
              login
            }
            state
            comments {
              totalCount
            }
            labels(first: 10) {
              nodes {
                name
              }
            }
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
                f"Unexpected response structure:\n{json.dumps(data, indent=2)}"
            )

        try:
            issues = data["data"]["repository"]["issues"]["nodes"]
            page_info = data["data"]["repository"]["issues"]["pageInfo"]
        except KeyError as e:
            raise RuntimeError(f"Unexpected response structure: {e}")

        results.extend(issues)

        if not page_info["hasNextPage"]:
            break
        variables["after"] = page_info["endCursor"]

    return results


def save_issues(owner: str, repo: str, issues: List[Dict]) -> None:
    """
    Save issues to a JSON file in the persistent data directory.
    """
    save_repo_data(owner, repo, issues, "issues.json")
