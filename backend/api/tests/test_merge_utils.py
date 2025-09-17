import json
import os
import tempfile
from pathlib import Path

import pytest

from api.utils.common import merge
from api.utils.common import save as save_module
from api.utils.common.save import load_repo_data, save_repo_data, stat_repo_file


def test_merge_contributions_with_quality_fallback(monkeypatch):
    owner, repo = "org", "proj"

    classified = [
        {"type": "commit", "hash": "c1", "category": "feature"},
        {"type": "issue", "number": 42, "category": "bug"},
        {"type": "pull", "number": 7, "category": "chore"},
        {"type": "contributor", "login": "alice", "category": "maintainer"},
        {"type": "ignored", "hash": "noop"},
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

    assert contributors[0]["type"] == "contributor"
    assert contributors[0]["category"] == "maintainer"


def test_merge_contributions_missing_quality_and_files(monkeypatch):
    owner, repo = "org", "proj"

    classified = [{"type": "commit", "hash": "c1", "category": "feature"}]

    data_by_file = {
        (None, "contributions_classified.json", "ai"): classified,
        (None, "message_quality.json", "ai"): None,
        (None, "message_quality_commit.json", "ai"): None,
        (None, "message_quality_issue.json", "ai"): None,
        (None, "message_quality_pr.json", "ai"): None,
        (None, "commits.json", None): [{"hash": "c1", "author": "Alice"}],
        (None, "contributors.json", None): None,
        (None, "issues.json", None): None,
        (None, "pulls.json", None): None,
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
    assert commits[0]["type"] == "commit"
    assert commits[0]["category"] == "feature"
    assert commits[0]["score"] is None
    assert commits[0]["suggestions"] is None


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


def test_save_repo_data_cleans_tmp_on_failure(monkeypatch, tmp_path):
    created = {}
    real_mkstemp = save_module.tempfile.mkstemp

    def fake_mkstemp(prefix, dir=None, text=True):
        fd, path = real_mkstemp(prefix=prefix, dir=dir, text=text)
        created["path"] = path
        return fd, path

    def fail_replace(_src, _dst):
        raise ValueError("boom")

    monkeypatch.setattr(save_module.tempfile, "mkstemp", fake_mkstemp)
    monkeypatch.setattr(save_module.os, "replace", fail_replace)

    with pytest.raises(ValueError):
        save_repo_data("org", "proj", {"k": "v"}, "data.json", base_dir=str(tmp_path))

    assert not os.path.exists(created["path"])


def test_save_repo_data_handles_remove_error(monkeypatch, tmp_path):
    created = {}
    real_mkstemp = save_module.tempfile.mkstemp

    def fake_mkstemp(prefix, dir=None, text=True):
        fd, path = real_mkstemp(prefix=prefix, dir=dir, text=text)
        created["path"] = path
        return fd, path

    def fail_replace(_src, _dst):
        raise ValueError("boom")

    def fail_remove(path):
        raise OSError("cannot remove")

    monkeypatch.setattr(save_module.tempfile, "mkstemp", fake_mkstemp)
    monkeypatch.setattr(save_module.os, "replace", fail_replace)
    monkeypatch.setattr(save_module.os, "remove", fail_remove)

    with pytest.raises(ValueError):
        save_repo_data("org", "proj", {"k": "v"}, "data.json", base_dir=str(tmp_path))

    assert os.path.exists(created["path"])


def test_stat_repo_file_missing(tmp_path):
    assert (
        stat_repo_file("org", "proj", "missing.json", base_dir=str(tmp_path))
        is None
    )


def test_load_repo_data_raises_after_retries(tmp_path):
    base_dir = tmp_path / "data"
    save_repo_data("org", "proj", {"ok": True}, "data.json", base_dir=str(base_dir))
    file_path = base_dir / "org__proj" / "data.json"
    file_path.write_text("{invalid", encoding="utf-8")

    with pytest.raises(json.JSONDecodeError):
        load_repo_data("org", "proj", "data.json", base_dir=str(base_dir))
