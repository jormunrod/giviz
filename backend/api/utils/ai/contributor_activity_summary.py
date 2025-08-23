import os
from openai import OpenAI
import json
from dotenv import load_dotenv

from api.utils.common.save import load_repo_data
from api.views import repo
from api.utils.common.merge import merge_contributor_activity

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
BATCH_SIZE = os.getenv("AI_BATCH_SIZE", 20)

client = OpenAI(api_key=OPENAI_API_KEY)

PROMPT_TEMPLATE = """
        
        """

EXAMPLE_INPUT = "json.dumps()"

EXAMPLE_OUTPUT = "json.dumps()"


def get_contributor_info(owner, repo, contributor) -> dict:
    """
    Fetch contributor information from the contributors.json file.
    """
    contributors_list = load_repo_data(owner, repo, "contributors.json")
    if isinstance(contributors_list, list):
        for c in contributors_list:
            if c.get("login") == contributor or c.get("name") == contributor:
                return c
        return {}
    return contributors_list.get(contributor, {})


def get_contributor_commits_summary(data) -> dict:
    """
    Fetch contributor commits summary from the provided data, filtering by the parameters of the list.
    """
    parameters = [
        "hash",
        "date",
        "message",
        "insertions",
        "deletions",
        "affected_extensions",
        "category",
        "score",
        "suggestions",
    ]
    for commit in data.get("commits", []):
        commit_summary = {
            param: commit.get(param) for param in parameters if param in commit
        }
        if commit_summary:
            yield commit_summary


def get_contributor_issues_summary(data) -> dict:
    """
    Fetch contributor issues summary from the provided data, filtering by the parameters of the list.
    """
    parameters = [
        "number",
        "title",
        "body",
        "createdAt",
        "closedAt",
        "category",
        "score",
        "suggestions",
    ]
    for issue in data.get("issues", []):
        issue_summary = {
            param: issue.get(param) for param in parameters if param in issue
        }
        if issue_summary:
            yield issue_summary


def get_contributor_pull_requests_summary(data) -> dict:
    """
    Fetch contributor pull requests summary from the provided data, filtering by the parameters of the list.
    """
    parameters = [
        "number",
        "title",
        "body",
        "createdAt",
        "mergedAt",
        "category",
        "score",
        "suggestions",
    ]
    for pr in data.get("pull_requests", []):
        pr_summary = {param: pr.get(param) for param in parameters if param in pr}
        if pr_summary:
            yield pr_summary


def generate_contributor_activity_summary(
    owner, repo, contributor, model: str = "gpt-4.1-nano"
) -> str:
    """
    Generates a summary of contributor activity using AI and the data provided.
    """
    contributor_info = get_contributor_info(owner, repo, contributor)

    contributor_name = contributor_info.get("name", "Unknown Contributor")
    contributor_avatar = contributor_info.get("avatarUrl", "Unknown Avatar")
    contributor_url = contributor_info.get("url", "Unknown URL")
    contributor_bio = contributor_info.get("bio", "Unknown Bio")
    contributor_company = contributor_info.get("company", "Unknown Company")
    contributor_location = contributor_info.get("location", "Unknown Location")
    contributor_email = contributor_info.get("email", "Unknown Email")
    contributor_created_at = contributor_info.get("createdAt", "Unknown Created At")

    data = merge_contributor_activity(owner, repo, contributor, contributor_name)
    commits_summary = list(get_contributor_commits_summary(data))
    issues_summary = list(get_contributor_issues_summary(data))
    pull_requests_summary = list(get_contributor_pull_requests_summary(data))

    return {
        "contributor_name": contributor_name,
        "avatar": contributor_avatar,
        "profile_url": contributor_url,
        "bio": contributor_bio,
        "company": contributor_company,
        "location": contributor_location,
        "email": contributor_email,
        "created_at": contributor_created_at,
        "commits_summary": commits_summary,
        "issues_summary": issues_summary,
        "pull_requests_summary": pull_requests_summary,
    }
