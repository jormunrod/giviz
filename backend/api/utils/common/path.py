import os
from typing import Optional


def get_repo_data_path(
    owner: str,
    repo: str,
    subfolder: Optional[str] = None,
    base_dir: Optional[str] = None,
) -> str:
    """Returns the path to store persistent data for a given repository, under backend/data or a custom base_dir.

    Args:
        owner: Repository owner.
        repo: Repository name.
        subfolder: Optional subfolder inside the repo directory.
        base_dir: Optional base directory for data (for testing or custom storage).

    """
    if base_dir is not None:
        base_path = os.path.abspath(base_dir)
    else:
        base_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../../data"),
        )
    safe_path = f"{owner}__{repo}".replace("/", "_")
    if subfolder:
        return os.path.join(base_path, safe_path, subfolder)
    return os.path.join(base_path, safe_path)
