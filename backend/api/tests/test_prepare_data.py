from api.utils.common.prepare_data import (
    prepare_commits,
    prepare_issues,
    prepare_pulls,
    prepare_contributors,
)


def test_prepare_commits_basic():
    data = [
        {
            "hash": "abc123",
            "parent_hashes": ["def456"],
            "author": "alice",
            "date": "2024-01-01T12:00:00",
            "message": "Initial commit" * 30,
            "files_changed": ["file1.py"],
            "n_files_changed": 1,
            "insertions": 10,
            "deletions": 0,
            "commit_type": "normal",
            "bot_field": "not_a_bot",
        },
        {
            "hash": "def456",
            "parent_hashes": [],
            "author": "dependabot[bot]",
            "date": "2024-01-02T12:00:00",
            "message": "Bump deps",
            "files_changed": ["file2.py"],
            "n_files_changed": 1,
            "insertions": 5,
            "deletions": 1,
            "commit_type": "bot",
        },
    ]
    cleaned = prepare_commits(data)
    assert len(cleaned) == 1
    assert cleaned[0]["author"] == "alice"
    assert len(cleaned[0]["message"]) <= 203
    assert set(cleaned[0].keys()) == {
        "hash",
        "parent_hashes",
        "author",
        "date",
        "message",
        "files_changed",
        "n_files_changed",
        "insertions",
        "deletions",
    }


def test_prepare_issues_basic():
    data = [
        {
            "number": 1,
            "title": "Bug found" * 50,
            "author": {"login": "bob"},
            "state": "open",
            "createdAt": "2024-01-01T10:00:00",
            "closedAt": None,
            "body": "A" * 300,
            "comments": {"totalCount": 2},
            "labels": {"nodes": ["bug"]},
        },
        {
            "number": 2,
            "title": "Automated issue",
            "author": {"login": "bot[bot]"},
            "state": "closed",
            "createdAt": "2024-01-02T10:00:00",
            "closedAt": "2024-01-03T10:00:00",
            "body": "Automated",
            "comments": {"totalCount": 0},
            "labels": {"nodes": []},
        },
    ]
    for issue in data:
        issue["author"] = issue["author"]["login"]
        issue["comments"] = issue["comments"]["totalCount"]
        issue["labels"] = issue["labels"]["nodes"]
    cleaned = prepare_issues(data)
    assert len(cleaned) == 1
    assert cleaned[0]["author"] == "bob"
    assert len(cleaned[0]["title"]) <= 203
    assert len(cleaned[0]["body"]) <= 203
    assert set(cleaned[0].keys()) == {
        "number",
        "author",
        "title",
        "state",
        "createdAt",
        "closedAt",
        "body",
        "comments",
        "labels",
    }


def test_prepare_pulls_basic():
    data = [
        {
            "number": 1,
            "title": "Add feature" * 30,
            "author": {"login": "carol"},
            "mergedBy": {"login": "dave"},
            "state": "merged",
            "createdAt": "2024-01-01T09:00:00",
            "closedAt": "2024-01-02T09:00:00",
            "mergedAt": "2024-01-02T09:00:00",
            "body": "B" * 600,
            "comments": {"totalCount": 5},
            "labels": {"nodes": ["enhancement"]},
        },
        {
            "number": 2,
            "title": "Update deps",
            "author": {"login": "dependabot[bot]"},
            "mergedBy": {"login": "dave"},
            "state": "closed",
            "createdAt": "2024-01-03T09:00:00",
            "closedAt": "2024-01-04T09:00:00",
            "mergedAt": None,
            "body": "Auto",
            "comments": {"totalCount": 0},
            "labels": {"nodes": []},
        },
    ]
    for pull in data:
        pull["author"] = pull["author"]["login"]
        pull["mergedBy"] = pull["mergedBy"]["login"]
        pull["comments"] = pull["comments"]["totalCount"]
        pull["labels"] = pull["labels"]["nodes"]
    cleaned = prepare_pulls(data)
    assert len(cleaned) == 1
    assert cleaned[0]["author"] == "carol"
    assert len(cleaned[0]["title"]) <= 203
    assert len(cleaned[0]["body"]) <= 503
    assert set(cleaned[0].keys()) == {
        "number",
        "title",
        "author",
        "mergedBy",
        "state",
        "createdAt",
        "closedAt",
        "mergedAt",
        "body",
        "comments",
        "labels",
    }


def test_prepare_contributors_basic():
    data = [
        {"login": "eve", "createdAt": "2024-01-01T08:00:00", "bio": "C" * 300},
        {
            "login": "github-actions[bot]",
            "createdAt": "2024-01-02T08:00:00",
            "bio": "Automated",
        },
    ]
    cleaned = prepare_contributors(data)
    assert len(cleaned) == 1
    assert cleaned[0]["login"] == "eve"
    assert len(cleaned[0]["bio"]) <= 203
    assert "createdAt" in cleaned[0]
