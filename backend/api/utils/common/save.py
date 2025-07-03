import os
import json
from typing import Any, Optional
from api.utils.common.path import get_repo_data_path


def save_repo_data(
    owner: str, repo: str, data: Any, filename: str, subfolder: Optional[str] = None
) -> None:
    """
    Save data to a reusable JSON file in the repository's persistent data folder, with optional subfolder support.
    Args:
        owner: Repository owner.
        repo: Repository name.
        data: Data to save (must be JSON serializable).
        filename: Name of the file (e.g., 'commits.json', 'issues.json').
        subfolder: Optional subfolder inside the repo directory (will be created if it doesn't exist).
    """
    path = get_repo_data_path(owner, repo, subfolder)
    os.makedirs(path, exist_ok=True)
    file_path = os.path.join(path, filename)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(
        f"Saved {len(data) if hasattr(data, '__len__') else 'data'} items to {file_path}"
    )


def load_repo_data(
    owner: str, repo: str, filename: str, subfolder: Optional[str] = None
) -> Any:
    """
    Load data from a JSON file in the repository's persistent data folder.
    Returns None if the file does not exist.
    """
    path = get_repo_data_path(owner, repo, subfolder)
    file_path = os.path.join(path, filename)
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)
