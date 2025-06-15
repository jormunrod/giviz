import os
from typing import Optional
from git import Repo
from dotenv import load_dotenv

load_dotenv()

REPOS_PATH = os.getenv("REPOS_PATH")
if not REPOS_PATH:
    raise RuntimeError("REPOS_PATH not set in environment")
REPOS_PATH = os.path.abspath(REPOS_PATH)
os.makedirs(REPOS_PATH, exist_ok=True)


def get_repo_local_path(owner: str, repo: str) -> str:
    """
    Get the local filesystem path for a given repository.
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
