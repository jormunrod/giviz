"""
Module to clone, update, analyze git repositories and save commit data.
"""

import json
import os
import re
from typing import List, Dict, Optional, Any

from git import Repo

REPOS_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../repos_cache")
)
os.makedirs(REPOS_PATH, exist_ok=True)

NULL_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"
COMMIT_TYPES = {
    "feat": "feature",
    "feature": "feature",
    "fix": "fix",
    "bug": "fix",
    "docs": "docs",
    "documentation": "docs",
    "test": "test",
    "tests": "test",
    "refactor": "refactor",
    "style": "style",
    "chore": "chore",
}


def get_repo_local_path(owner: str, repo: str) -> str:
    """
    Get the local filesystem path for a given repository.

    Args:
        owner: Repository owner name.
        repo: Repository name.

    Returns:
        The local path where the repository is or will be stored.
    """
    safe_path = f"{owner}__{repo}".replace("/", "_")
    return os.path.join(REPOS_PATH, safe_path)


def clone_or_update_repo(
        git_url: str, owner: str, repo: str, depth: Optional[int] = None
) -> Repo:
    """
    Clone the repository if not present locally or update it if it exists.

    Args:
        git_url: The git repository URL.
        owner: Repository owner name.
        repo: Repository name.
        depth: Optional depth for shallow clone or fetch.

    Returns:
        A git.Repo object representing the local repository.
    """
    local_path = get_repo_local_path(owner, repo)
    if os.path.exists(local_path):
        repo_obj = Repo(local_path)
        shallow_file = os.path.join(local_path, ".git", "shallow")
        if depth is None:
            if os.path.exists(shallow_file):
                repo_obj.git.fetch("--unshallow")
            repo_obj.remotes.origin.pull()
        else:
            if os.path.exists(shallow_file):
                repo_obj.git.fetch("--deepen", str(depth))
            repo_obj.remotes.origin.pull()
    else:
        clone_kwargs = (
            {"depth": depth, "single_branch": True}
            if depth
            else {"single_branch": True}
        )
        repo_obj = Repo.clone_from(git_url, local_path, **clone_kwargs)
    return repo_obj


def detect_commit_type(message: Optional[str]) -> str:
    """
    Detect the type of commit from its message.

    Args:
        message: Commit message string.

    Returns:
        Commit type as a string.
    """
    if not message:
        return "unknown"
    msg = message.strip().lower()

    m = re.match(r"^(\w+):", msg)
    if m:
        key = m.group(1)
        return COMMIT_TYPES.get(key, key)

    for key, value in COMMIT_TYPES.items():
        if re.search(r"\b" + re.escape(key) + r"\b", msg):
            return value

    return "other"


def analyze_commits(
        owner: str, repo: str, branch: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Analyze commits of a given repository and branch.

    Args:
        owner: Repository owner name.
        repo: Repository name.
        branch: Branch name to analyze. If None, defaults to main or master.

    Returns:
        A list of dictionaries containing commit data.
    """
    local_path = get_repo_local_path(owner, repo)
    repo_obj = Repo(local_path)

    if branch is None:
        try:
            branch = repo_obj.git.symbolic_ref("refs/remotes/origin/HEAD").split("/")[
                -1
            ]
        except Exception:
            branches = [b.name for b in repo_obj.remote().refs]
            if "main" in branches:
                branch = "main"
            elif "master" in branches:
                branch = "master"
            else:
                raise Exception("No default branch found (tried 'main' and 'master').")

    commits = []
    for c in repo_obj.iter_commits(branch):
        files_added = []
        files_deleted = []
        files_renamed = []

        # if the commit has no parents, it is the initial commit
        parent = c.parents[0] if c.parents else None
        for diff in parent.diff(c) if parent else c.diff(NULL_TREE):
            if diff.new_file:
                files_added.append(diff.b_path)
            elif diff.deleted_file:
                files_deleted.append(diff.a_path)
            elif diff.renamed_file:
                files_renamed.append({"from": diff.a_path, "to": diff.b_path})
        commits.append(
            {
                "hash": c.hexsha,
                "author": c.author.name,
                "email": c.author.email,
                "committer": c.committer.name,
                "committer_email": c.committer.email,
                "date": c.committed_datetime.isoformat(),
                "committer_date": c.committed_datetime.isoformat(),
                "author_tz_offset": c.author_tz_offset,
                "committer_tz_offset": c.committer_tz_offset,
                "message": c.message,
                "message_length": len(c.message.strip()),
                "parent_hashes": [p.hexsha for p in c.parents],
                "n_parents": len(c.parents),
                "is_merge": len(c.parents) > 1,
                "is_initial_commit": len(c.parents) == 0,
                "files_changed": list(c.stats.files.keys()),
                "n_files_changed": len(c.stats.files),
                "files_added": files_added,
                "files_deleted": files_deleted,
                "files_renamed": files_renamed,
                "insertions": c.stats.total["insertions"],
                "deletions": c.stats.total["deletions"],
                "commit_size": c.stats.total["insertions"] + c.stats.total["deletions"],
                "weekday": c.committed_datetime.weekday(),
                "hour": c.committed_datetime.hour,
                "commit_timestamp": int(c.committed_datetime.timestamp()),
                "commit_day": c.committed_datetime.date().isoformat(),
                "affected_extensions": list(
                    {os.path.splitext(f)[1] for f in c.stats.files.keys()}
                ),
                "has_test_changes": any(
                    "test" in f.lower() for f in c.stats.files.keys()
                ),
                "has_doc_changes": any(
                    f.lower().endswith(".md") or "doc" in f.lower()
                    for f in c.stats.files.keys()
                ),
                "is_revert": "revert" in c.message.lower(),
                "commit_type": detect_commit_type(c.message),
            }
        )
    return commits


def save_commits(owner: str, repo: str, commits: List[Dict[str, Any]]) -> None:
    """
    Save analyzed commits to a JSON file in the local repository path.

    Args:
        owner: Repository owner name.
        repo: Repository name.
        commits: List of commit data dictionaries to save.
    """
    local_path = get_repo_local_path(owner, repo)
    with open(os.path.join(local_path, "commits.json"), "w", encoding="utf-8") as f:
        json.dump(commits, f, indent=2, ensure_ascii=False)
