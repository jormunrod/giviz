import os
from typing import Optional


def get_repo_data_path(owner: str, repo: str, subfolder: Optional[str] = None) -> str:
    """
    Returns the path to store persistent data for a given repository, under backend/data.
    Args:
        owner: Repository owner.
        repo: Repository name.
        subfolder: Optional subfolder inside the repo directory.
    """
    base_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../data")
    )
    safe_path = f"{owner}__{repo}".replace("/", "_")
    if subfolder:
        return os.path.join(base_path, safe_path, subfolder)
    return os.path.join(base_path, safe_path)
