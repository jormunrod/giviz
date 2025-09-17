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
