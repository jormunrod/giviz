from datetime import datetime
from typing import List, Dict, Any, Optional
import re


def filter_bots(
    data: List[Dict[str, Any]], user_field: str = "author"
) -> List[Dict[str, Any]]:
    """Remove items where the user is a bot (by username or email)."""
    return [
        item
        for item in data
        if not re.search(r"bot", str(item.get(user_field, "")).lower())
    ]


def normalize_dates(
    data: List[Dict[str, Any]],
    date_fields: Optional[List[str]] = None,
    fmt: str = "%Y-%m-%d",
) -> List[Dict[str, Any]]:
    """Convert all date fields to a consistent string format."""
    if date_fields is None:
        date_fields = [
            k for k in data[0].keys() if "date" in k or "created" in k or "updated" in k
        ]
    for item in data:
        for field in date_fields:
            if field in item and item[field]:
                try:
                    item[field] = datetime.fromisoformat(str(item[field])).strftime(fmt)
                except Exception:
                    item[field] = str(item[field])[:10]
    return data


def truncate_texts(
    data: List[Dict[str, Any]], fields: List[str], max_length: int = 200
) -> List[Dict[str, Any]]:
    """Truncate long text fields to max_length."""
    for item in data:
        for field in fields:
            if (
                field in item
                and isinstance(item[field], str)
                and len(item[field]) > max_length
            ):
                item[field] = item[field][:max_length] + "..."
    return data


def select_fields(
    data: List[Dict[str, Any]], fields: List[str]
) -> List[Dict[str, Any]]:
    """Keep only the specified fields in each item."""
    return [{k: v for k, v in item.items() if k in fields} for item in data]


def prepare_commits(
    commits: List[Dict[str, Any]], max_items: int = 100
) -> List[Dict[str, Any]]:
    """Pipeline to clean and prepare commit data for prompts."""
    commits = commits[:max_items]
    commits = filter_bots(commits, user_field="author")
    commits = normalize_dates(commits, ["date", "committer_date"])
    commits = truncate_texts(commits, ["message"], max_length=200)
    fields = [
        "hash",
        "parent_hashes",
        "author",
        "date",
        "message",
        "files_changed",
        "n_files_changed",
        "insertions",
        "deletions",
    ]
    commits = select_fields(commits, fields)
    return commits


def prepare_issues(
    issues: List[Dict[str, Any]], max_items: int = 100
) -> List[Dict[str, Any]]:
    issues = issues[:max_items]
    issues = filter_bots(issues, user_field="author")
    issues = normalize_dates(issues, ["createdAt", "closedAt"])
    issues = truncate_texts(issues, ["title", "body"], max_length=200)
    fields = [
        "number",
        "author",
        "title",
        "state",
        "createdAt",
        "closedAt",
        "body",
        "comments",
        "labels",
    ]
    issues = select_fields(issues, fields)
    return issues


def prepare_pulls(
    pulls: List[Dict[str, Any]], max_items: int = 100
) -> List[Dict[str, Any]]:
    pulls = pulls[:max_items]
    pulls = filter_bots(pulls, user_field="author")
    pulls = normalize_dates(pulls, ["createdAt", "closedAt", "mergedAt"])
    pulls = truncate_texts(pulls, ["title"], max_length=200)
    pulls = truncate_texts(pulls, ["body"], max_length=500)
    fields = [
        "number",
        "title",
        "author",
        "mergedBy",
        "state",
        "createdAt",
        "closedAt",
        "mergedAt",
        "body",
        "comments",
        "labels",
    ]
    pulls = select_fields(pulls, fields)
    return pulls


def prepare_contributors(
    contributors: List[Dict[str, Any]], max_items: int = 100
) -> List[Dict[str, Any]]:
    """Pipeline to clean and prepare contributor data for prompts."""
    contributors = contributors[:max_items]
    contributors = filter_bots(contributors, user_field="login")
    contributors = normalize_dates(contributors, ["createdAt"])
    contributors = truncate_texts(contributors, ["bio"], max_length=200)
    return contributors
