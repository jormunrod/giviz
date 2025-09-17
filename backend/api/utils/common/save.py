import json
import os
import tempfile
from datetime import datetime, timezone
from typing import Any, Optional, Dict


from api.utils.common.path import get_repo_data_path


def save_repo_data(
    owner: str,
    repo: str,
    data: Any,
    filename: str,
    subfolder: Optional[str] = None,
    base_dir: Optional[str] = None,
) -> None:
    """Save data to a reusable JSON file in the repository's persistent data folder, with optional subfolder and base_dir support.

    Args:
        owner: Repository owner.
        repo: Repository name.
        data: Data to save (must be JSON serializable).
        filename: Name of the file (e.g., 'commits.json', 'issues.json').
        subfolder: Optional subfolder inside the repo directory (will be created if it doesn't exist).
        base_dir: Optional base directory for data (for testing or custom storage).

    """
    path = get_repo_data_path(owner, repo, subfolder, base_dir=base_dir)
    os.makedirs(path, exist_ok=True)
    file_path = os.path.join(path, filename)

    # Write atomically: write to a temp file in the same directory and replace.
    # This prevents readers from observing partially written files.
    fd, tmp_path = tempfile.mkstemp(prefix=f".{filename}.", dir=path, text=True)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, file_path)
    finally:
        # If something went wrong before replace, ensure temp file is removed
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
    print(
        f"Saved {len(data) if hasattr(data, '__len__') else 'data'} items to {file_path}",
    )


def load_repo_data(
    owner: str,
    repo: str,
    filename: str,
    subfolder: Optional[str] = None,
    base_dir: Optional[str] = None,
) -> Any:
    """Load data from a JSON file in the repository's persistent data folder or custom base_dir.
    Returns None if the file does not exist.
    """
    path = get_repo_data_path(owner, repo, subfolder, base_dir=base_dir)
    file_path = os.path.join(path, filename)
    if not os.path.exists(file_path):
        return None

    # Light retry loop to handle rare transient decode errors
    # if a replace just occurred on another thread/process.
    attempts = 3
    last_err = None
    for _ in range(attempts):
        try:
            with open(file_path, encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            # Small sleep then retry
            last_err = e
            try:
                import time

                time.sleep(0.03)
            except Exception:
                pass
    # If still failing, raise the last error to surface the issue.
    raise last_err


def stat_repo_file(
    owner: str,
    repo: str,
    filename: str,
    subfolder: Optional[str] = None,
    base_dir: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Return file metadata (exists, size, mtime) or None if not found."""
    path = get_repo_data_path(owner, repo, subfolder, base_dir=base_dir)
    file_path = os.path.join(path, filename)
    try:
        st = os.stat(file_path)
        mtime = datetime.fromtimestamp(st.st_mtime, tz=timezone.utc)
        return {
            "exists": True,
            "path": file_path,
            "size": st.st_size,
            "mtime_iso": mtime.isoformat(),
            "mtime_epoch": int(st.st_mtime),
        }
    except FileNotFoundError:
        return None
