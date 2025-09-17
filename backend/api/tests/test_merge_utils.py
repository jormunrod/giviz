import json
from pathlib import Path

import pytest

from api.utils.common import merge
from api.utils.common.save import load_repo_data, save_repo_data, stat_repo_file


def test_merge_contributions_with_quality_fallback(monkeypatch):
    owner, repo = "org", "proj"

    classified = [
        {"type": "commit", "hash": "c1", "category": "feature"},
        {"type": "issue", "number": 42, "category": "bug"},
        {"type": "pull", "number": 7, "category": "chore"},
    ]

    message_quality = [
        {"id": "c1", "type": "commit", "score": 0.9, "suggestions": ["fix"]},
        {"id": 42, "type": "issue", "score": 0.3, "suggestions": ["clarify"]},
        {"id": 7, "type": "pr", "score": 0.5, "suggestions": []},
    ]

    data_by_file = {
        (None, "contributions_classified.json", "ai"): classified,
        (None, "message_quality.json", "ai"): message_quality,
        (None, "message_quality_commit.json", "ai"): [
            {"id": "c1", "score": 0.95, "suggestions": ["polish"]}
        ],
        (None, "message_quality_issue.json", "ai"): None,
        (None, "message_quality_pr.json", "ai"): None,
        (None, "commits.json", None): [{"hash": "c1", "author": "Alice"}],
        (None, "contributors.json", None): [{"login": "alice", "name": "Alice"}],
        (None, "issues.json", None): [{"number": 42, "title": "Bug"}],
        (None, "pulls.json", None): [{"number": 7, "title": "Fix"}],
    }

    saved = {}

    def fake_load(owner_arg, repo_arg, filename, subfolder=None, base_dir=None):
        assert (owner_arg, repo_arg) == (owner, repo)
        return data_by_file.get((None, filename, subfolder))

    def fake_save(owner_arg, repo_arg, data, filename, subfolder=None, base_dir=None):
        assert (owner_arg, repo_arg) == (owner, repo)
        saved[(subfolder, filename)] = data

    monkeypatch.setattr(merge, "load_repo_data", fake_load)
    monkeypatch.setattr(merge, "save_repo_data", fake_save)

    merge.merge_contributions(owner, repo)

    commits = saved[("merged", "commits_typed.json")]
    issues = saved[("merged", "issues_typed.json")]
    pulls = saved[("merged", "pulls_typed.json")]
    contributors = saved[("merged", "contributors_typed.json")]

    assert commits[0]["type"] == "commit"
    assert commits[0]["category"] == "feature"
    assert commits[0]["score"] == 0.95
    assert commits[0]["suggestions"] == ["polish"]

    assert issues[0]["score"] == 0.3  # pulled from global quality fallback
    assert issues[0]["type"] == "issue"

    assert pulls[0]["score"] == 0.5
    assert pulls[0]["suggestions"] == []

    # contributor list carried over even without classification
    assert contributors[0]["type"] is None
    assert contributors[0]["category"] is None


def test_merge_contributions_requires_classified_file(monkeypatch):
    def fake_load(*_args, **_kwargs):
        return None

    monkeypatch.setattr(merge, "load_repo_data", fake_load)

    with pytest.raises(FileNotFoundError):
        merge.merge_contributions("org", "proj")


def test_merge_contributor_activity_gathers_all_sources(monkeypatch):
    owner, repo = "org", "proj"

    data_by_file = {
        ("merged", "commits_typed.json"): [
            {"author": "Alice", "email": "alice@example.com"},
            {"committer": "alice", "committer_email": "alice@example.com"},
            {"author": "Other", "email": "other@example.com"},
        ],
        ("merged", "issues_typed.json"): [
            {"author": {"login": "alice"}},
            {"login": "someone"},
        ],
        ("merged", "pulls_typed.json"): [
            {"author": {"login": "alice"}},
            {"login": "not-alice"},
        ],
    }

    saved = {}

    def fake_load(owner_arg, repo_arg, filename, subfolder=None, base_dir=None):
        assert (owner_arg, repo_arg) == (owner, repo)
        return data_by_file.get((subfolder, filename))

    def fake_save(owner_arg, repo_arg, data, filename, subfolder=None, base_dir=None):
        assert (owner_arg, repo_arg) == (owner, repo)
        saved[(subfolder, filename)] = data

    monkeypatch.setattr(merge, "load_repo_data", fake_load)
    monkeypatch.setattr(merge, "save_repo_data", fake_save)

    result = merge.merge_contributor_activity("org", "proj", "alice", "Alice")

    assert len(result["commits"]) == 2
    # Because of the current implementation any issue with a login is included.
    assert len(result["issues"]) == 2
    assert len(result["pull_requests"]) == 1

    saved_result = saved[("contributors", "alice_activity.json")]
    assert saved_result == result


def test_merge_contributor_activity_without_matches(monkeypatch):
    def fake_load(*_args, **_kwargs):
        return []

    monkeypatch.setattr(merge, "load_repo_data", fake_load)

    with pytest.raises(ValueError):
        merge.merge_contributor_activity("org", "proj", "alice", "Alice")


def test_save_and_load_repo_data_roundtrip(tmp_path):
    data = {"value": 1, "items": [1, 2, 3]}

    save_repo_data("org", "proj", data, "data.json", base_dir=str(tmp_path))

    loaded = load_repo_data("org", "proj", "data.json", base_dir=str(tmp_path))
    assert loaded == data

    stat = stat_repo_file("org", "proj", "data.json", base_dir=str(tmp_path))
    assert stat is not None
    assert stat["exists"] is True
    assert stat["size"] > 0

    file_path = Path(stat["path"])
    assert json.loads(file_path.read_text()) == data


def test_load_repo_data_returns_none_when_missing(tmp_path):
    assert load_repo_data("org", "proj", "missing.json", base_dir=str(tmp_path)) is None
