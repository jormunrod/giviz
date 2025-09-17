from types import SimpleNamespace

from api.utils.ai import contributor_activity_summary as summary


def test_get_contributor_info_from_list(monkeypatch):
    contributors = [{"login": "alice", "name": "Alice"}]
    monkeypatch.setattr(summary, "load_repo_data", lambda *_args, **_kwargs: contributors)

    info = summary.get_contributor_info("org", "proj", "alice")

    assert info == contributors[0]


def test_get_contributor_info_returns_empty_when_missing(monkeypatch):
    contributors = [{"login": "bob", "name": "Bob"}]
    monkeypatch.setattr(summary, "load_repo_data", lambda *_args, **_kwargs: contributors)

    info = summary.get_contributor_info("org", "proj", "alice")

    assert info == {}


def test_get_contributor_info_from_dict(monkeypatch):
    contributors = {"alice": {"login": "alice", "name": "Alice"}}
    monkeypatch.setattr(summary, "load_repo_data", lambda *_args, **_kwargs: contributors)

    info = summary.get_contributor_info("org", "proj", "alice")

    assert info == contributors["alice"]


def test_get_contributor_summaries_extract_fields():
    data = {
        "commits": [
            {"hash": "h1", "message": "msg", "extra": "ignore"},
        ],
        "issues": [
            {"number": 1, "title": "issue", "body": "body", "other": "x"},
        ],
        "pull_requests": [
            {"number": 2, "title": "pr", "mergedAt": "date", "random": "y"},
        ],
    }

    commits = list(summary.get_contributor_commits_summary(data))
    issues = list(summary.get_contributor_issues_summary(data))
    pulls = list(summary.get_contributor_pull_requests_summary(data))

    assert commits[0] == {"hash": "h1", "message": "msg"}
    assert issues[0]["number"] == 1 and "other" not in issues[0]
    assert pulls[0]["mergedAt"] == "date" and "random" not in pulls[0]


def test_prepare_prompt_renders_activity(monkeypatch):
    contributor_info = [{"login": "alice", "name": "Alice"}]
    activity = {
        "commits": [{"hash": "h1", "message": "Add feature"}],
        "issues": [{"number": 1, "title": "Bug", "body": "desc"}],
        "pull_requests": [{"number": 2, "title": "PR", "body": "desc"}],
    }

    monkeypatch.setattr(summary, "load_repo_data", lambda *_args, **_kwargs: contributor_info)
    monkeypatch.setattr(
        summary,
        "merge_contributor_activity",
        lambda owner, repo, contributor, contributor_name: activity,
    )

    prompt = summary.prepare_prompt("org", "proj", "alice")

    assert "Alice" in prompt
    assert "Add feature" in prompt
    assert "Bug" in prompt


def test_generate_contributor_activity_summary(monkeypatch):
    monkeypatch.setattr(summary, "prepare_prompt", lambda *_args, **_kwargs: "prompt")

    dummy_client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(
                create=lambda **_kwargs: SimpleNamespace(
                    choices=[
                        SimpleNamespace(
                            message=SimpleNamespace(content="Summary text\n")
                        )
                    ]
                )
            )
        )
    )
    monkeypatch.setattr(summary, "client", dummy_client)

    result = summary.generate_contributor_activity_summary("org", "proj", "alice")

    assert result == "Summary text"
