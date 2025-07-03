import os
import logging
from typing import Optional, Tuple
from git import Repo, GitCommandError
from dotenv import load_dotenv

# Ensure logging is configured globally
try:
    import backend.logging_config  # noqa: F401
except ImportError:
    logging.basicConfig(level=logging.INFO)

load_dotenv()

REPOS_PATH = os.getenv(
    "REPOS_PATH",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../repos_cache")),
)
REPOS_PATH = os.path.abspath(REPOS_PATH)
os.makedirs(REPOS_PATH, exist_ok=True)

logger = logging.getLogger(__name__)


def get_repo_local_path(owner: str, repo: str) -> str:
    """
    Get the local filesystem path for a given repository.
    """
    safe_path = f"{owner}__{repo}".replace("/", "_")
    return os.path.join(REPOS_PATH, safe_path)


def clone_or_update_repo(
    git_url: str, owner: str, repo: str, depth: Optional[int] = None
) -> Tuple[Optional[Repo], str]:
    """
    Clone the repository if not present locally or update it if it exists.
    Returns a tuple (Repo object or None, status string: 'cloned', 'updated', 'error').
    """
    local_path = get_repo_local_path(owner, repo)
    try:
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
            logger.info(f"Updated repo {owner}/{repo} at {local_path}")
            return repo_obj, "updated"
        else:
            clone_kwargs = (
                {"depth": depth, "single_branch": True}
                if depth
                else {"single_branch": True}
            )
            repo_obj = Repo.clone_from(git_url, local_path, **clone_kwargs)
            logger.info(f"Cloned repo {owner}/{repo} at {local_path}")
            return repo_obj, "cloned"
    except (GitCommandError, Exception) as e:
        logger.error(f"Error cloning/updating repo {owner}/{repo}: {e}")
        return None, "error"
