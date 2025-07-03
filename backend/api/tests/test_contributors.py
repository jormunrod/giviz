import pytest
from rest_framework.test import APIClient
from unittest.mock import patch


@pytest.mark.django_db
def test_get_contributors_not_found():
    client = APIClient()
    response = client.get("/api/contributors/?owner=someuser&repo=somerepo")
    assert response.status_code == 404
    assert "error" in response.json()


@pytest.mark.django_db
def test_extract_contributors_invalid():
    client = APIClient()
    response = client.post("/api/contributors/extract/", data={})
    assert response.status_code == 400
    assert (
        "owner" in response.json()
        or "repo" in response.json()
        or "error" in response.json()
    )


@pytest.mark.django_db
@patch("api.views.contributors.fetch_contributors")
@patch("api.views.contributors.save_contributors")
def test_extract_contributors_success(mock_save, mock_fetch):
    mock_fetch.return_value = [{"login": "testuser", "name": "Test User"}]
    client = APIClient()
    data = {"owner": "testuser", "repo": "testrepo"}
    response = client.post("/api/contributors/extract/", data=data)
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["n_contributors"] == 1
    mock_fetch.assert_called_once_with("testuser", "testrepo")
    mock_save.assert_called_once()
