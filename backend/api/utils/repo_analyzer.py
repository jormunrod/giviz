import json
import os

from git import Repo

REPOS_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../repos_cache")
)


def get_repo_local_path(owner, repo):
    safe_path = f"{owner}__{repo}".replace("/", "_")
    return os.path.join(REPOS_PATH, safe_path)


def clone_or_update_repo(git_url, owner, repo, depth=None):
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


def analyze_and_save_commits(owner, repo, branch=None):
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
        commits.append(
            {
                "hash": c.hexsha,
                "author": c.author.name,
                "email": c.author.email,
                "date": c.committed_datetime.isoformat(),
                "message": c.message,
            }
        )
    with open(os.path.join(local_path, "commits.json"), "w") as f:
        json.dump(commits, f, indent=2)
