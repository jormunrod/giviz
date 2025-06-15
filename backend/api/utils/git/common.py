import os

REPOS_PATH = os.getenv("REPOS_PATH")

if REPOS_PATH is None:
    raise RuntimeError("REPOS_PATH not set in environment")

REPOS_PATH = os.path.abspath(REPOS_PATH)
os.makedirs(REPOS_PATH, exist_ok=True)
