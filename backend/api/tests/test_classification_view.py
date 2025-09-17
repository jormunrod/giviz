import pytest
from rest_framework.test import APIRequestFactory

from api.views import classification


@pytest.mark.django_db
def test_classification_merge_view_success(monkeypatch):
    called = {}

    def fake_merge(owner, repo):
        called["args"] = (owner, repo)

    monkeypatch.setattr(classification, "merge_contributions", fake_merge)

    factory = APIRequestFactory()
    request = factory.post("/api/classification/merge/", {"owner": "org", "repo": "proj"}, format="json")
    response = classification.merge_contributions_view(request)

    assert response.status_code == 200
    assert called["args"] == ("org", "proj")


@pytest.mark.django_db
def test_classification_merge_view_invalid_payload():
    factory = APIRequestFactory()
    request = factory.post("/api/classification/merge/", {}, format="json")
    response = classification.merge_contributions_view(request)

    assert response.status_code == 400


@pytest.mark.django_db
def test_classification_merge_view_not_found(monkeypatch):
    monkeypatch.setattr(
        classification,
        "merge_contributions",
        lambda owner, repo: (_ for _ in ()).throw(FileNotFoundError("missing")),
    )

    factory = APIRequestFactory()
    request = factory.post("/api/classification/merge/", {"owner": "org", "repo": "proj"}, format="json")
    response = classification.merge_contributions_view(request)

    assert response.status_code == 404


@pytest.mark.django_db
def test_classification_merge_view_unexpected_error(monkeypatch):
    monkeypatch.setattr(
        classification,
        "merge_contributions",
        lambda owner, repo: (_ for _ in ()).throw(RuntimeError("boom")),
    )

    factory = APIRequestFactory()
    request = factory.post("/api/classification/merge/", {"owner": "org", "repo": "proj"}, format="json")
    response = classification.merge_contributions_view(request)

    assert response.status_code == 500
