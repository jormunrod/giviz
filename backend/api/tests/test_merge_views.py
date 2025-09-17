import pytest
from rest_framework.test import APIClient

from api.views import merge as merge_views


@pytest.mark.django_db
def test_merge_contributions_view_success(monkeypatch):
    calls = {}

    def fake_merge(owner, repo):
        calls["args"] = (owner, repo)

    monkeypatch.setattr(merge_views, "merge_contributions", fake_merge)

    client = APIClient()
    response = client.post(
        "/api/merge/", {"owner": "org", "repo": "proj"}, format="json"
    )

    assert response.status_code == 200
    assert calls["args"] == ("org", "proj")
    assert response.json()["status"] == "ok"


@pytest.mark.django_db
def test_merge_contributions_view_invalid_payload():
    client = APIClient()
    response = client.post("/api/merge/", {}, format="json")

    assert response.status_code == 400
    body = response.json()
    assert body["error"] == "Missing or invalid parameters"
    assert "owner" in body["detail"]


@pytest.mark.django_db
def test_merge_contributions_view_not_found(monkeypatch):
    def fake_merge(owner, repo):
        raise FileNotFoundError("missing")

    monkeypatch.setattr(merge_views, "merge_contributions", fake_merge)

    client = APIClient()
    response = client.post(
        "/api/merge/", {"owner": "org", "repo": "proj"}, format="json"
    )

    assert response.status_code == 404
    assert response.json()["error"] == "missing"


@pytest.mark.django_db
def test_merge_contributions_view_unexpected_error(monkeypatch):
    def fake_merge(owner, repo):
        raise RuntimeError("boom")

    monkeypatch.setattr(merge_views, "merge_contributions", fake_merge)

    client = APIClient()
    response = client.post(
        "/api/merge/", {"owner": "org", "repo": "proj"}, format="json"
    )

    assert response.status_code == 500
    assert response.json()["error"] == "boom"


@pytest.mark.django_db
def test_merge_contributors_by_category_success(monkeypatch):
    monkeypatch.setattr(merge_views, "merge_contributions", lambda o, r: None)

    def fake_load(owner, repo, filename, subfolder=None):
        if filename == "commits_typed.json" and subfolder == "merged":
            return [
                {"hash": "h1", "author": {"login": "alice"}, "category": "dev"},
            ]
        if filename == "issues_typed.json" and subfolder == "merged":
            return [
                {"number": 1, "author": {"login": "alice"}, "category": "bug"},
            ]
        if filename == "pulls_typed.json" and subfolder == "merged":
            return [
                {"number": 2, "author": {"login": "alice"}, "category": "dev"},
            ]
        if filename == "contributors_typed.json" and subfolder == "merged":
            return [{"login": "alice", "name": "Alice"}]
        return []

    monkeypatch.setattr(merge_views, "load_repo_data", fake_load)

    client = APIClient()
    response = client.post(
        "/api/merge/contributors_by_category/",
        {"owner": "org", "repo": "proj"},
        format="json",
    )

    assert response.status_code == 200
    data = response.json()["contributors"]
    assert data["alice"]["dev"]["commits"] == ["h1"]
    assert data["alice"]["bug"]["issues"] == [1]


@pytest.mark.django_db
def test_contributor_stats_view_success(monkeypatch):
    monkeypatch.setattr(merge_views, "merge_contributions", lambda o, r: None)

    def fake_load(owner, repo, filename, subfolder=None):
        if filename == "commits_typed.json" and subfolder == "merged":
            return [
                {
                    "hash": "h1",
                    "author": {"login": "alice"},
                    "category": "dev",
                    "score": 0.9,
                    "date": "2024-01-02T10:00:00Z",
                }
            ]
        if filename == "issues_typed.json" and subfolder == "merged":
            return [
                {
                    "number": 1,
                    "author": {"login": "alice"},
                    "category": "bug",
                    "score": 0.5,
                    "createdAt": "2024-01-03T12:00:00Z",
                }
            ]
        if filename == "pulls_typed.json" and subfolder == "merged":
            return [
                {
                    "number": 2,
                    "author": {"login": "alice"},
                    "category": "dev",
                    "score": 0.8,
                    "created_at": "2024-01-04T12:00:00Z",
                }
            ]
        if filename == "contributors_typed.json" and subfolder == "merged":
            return [{"login": "alice", "name": "Alice"}]
        return []

    monkeypatch.setattr(merge_views, "load_repo_data", fake_load)

    client = APIClient()
    response = client.post(
        "/api/merge/contributor_stats/",
        {"owner": "org", "repo": "proj", "contributor": "alice"},
        format="json",
    )

    assert response.status_code == 200
    stats = response.json()["stats"]
    assert stats["alice"]["dev"]["commits"][0]["hash"] == "h1"
    assert stats["alice"]["bug"]["issues"][0]["number"] == 1


@pytest.mark.django_db
def test_contributors_effort_by_category_success(monkeypatch):
    monkeypatch.setattr(merge_views, "merge_contributions", lambda o, r: None)

    def fake_load(owner, repo, filename, subfolder=None):
        if filename == "commits_typed.json" and subfolder == "merged":
            return [
                {
                    "hash": "h1",
                    "author": {"login": "alice"},
                    "category": "dev",
                    "insertions": 5,
                    "deletions": 3,
                }
            ]
        if filename == "issues_typed.json" and subfolder == "merged":
            return [
                {"number": 1, "author": {"login": "alice"}, "category": "doc"}
            ]
        if filename == "pulls_typed.json" and subfolder == "merged":
            return [
                {"number": 2, "author": {"login": "alice"}, "category": "dev"}
            ]
        if filename == "contributors_typed.json" and subfolder == "merged":
            return [{"login": "alice", "name": "Alice"}]
        return []

    monkeypatch.setattr(merge_views, "load_repo_data", fake_load)

    client = APIClient()
    response = client.post(
        "/api/merge/contributors_effort_by_category/",
        {"owner": "org", "repo": "proj"},
        format="json",
    )

    assert response.status_code == 200
    contributors = response.json()["contributors"]
    assert contributors["alice"]["dev"]["commits"] == 8
    assert contributors["alice"]["dev"]["dedication"] > 0


@pytest.mark.django_db
def test_contributors_message_quality_success(monkeypatch):
    monkeypatch.setattr(merge_views, "load_repo_data", lambda *_args, **_kwargs: [{"id": "h1"}])

    client = APIClient()
    response = client.post(
        "/api/merge/contributors_message_quality/",
        {"owner": "org", "repo": "proj"},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"] == [{"id": "h1"}]


@pytest.mark.django_db
def test_contributors_message_quality_no_data(monkeypatch):
    monkeypatch.setattr(merge_views, "load_repo_data", lambda *_args, **_kwargs: None)

    client = APIClient()
    response = client.post(
        "/api/merge/contributors_message_quality/",
        {"owner": "org", "repo": "proj"},
        format="json",
    )

    assert response.status_code == 404


@pytest.mark.django_db
def test_contributors_message_quality_error(monkeypatch):
    monkeypatch.setattr(
        merge_views, "load_repo_data", lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("boom"))
    )

    client = APIClient()
    response = client.post(
        "/api/merge/contributors_message_quality/",
        {"owner": "org", "repo": "proj"},
        format="json",
    )

    assert response.status_code == 500


@pytest.mark.django_db
@pytest.mark.parametrize(
    "path",
    [
        "/api/merge/contributors_by_category/",
        "/api/merge/contributor_stats/",
        "/api/merge/contributors_effort_by_category/",
        "/api/merge/contributors_message_quality/",
    ],
)
def test_merge_views_invalid_payloads(path):
    client = APIClient()
    response = client.post(path, {}, format="json")

    assert response.status_code == 400
