import pytest
from rest_framework.test import APIClient
from unittest.mock import patch


@pytest.mark.django_db
def test_get_issues_not_found():
    client = APIClient()
    response = client.get("/api/issues/?owner=someuser&repo=somerepo")
    assert response.status_code == 404
    assert "error" in response.json()


@pytest.mark.django_db
def test_extract_issues_invalid():
    client = APIClient()
    response = client.post("/api/issues/extract/", data={})
    assert response.status_code == 400
    assert (
        "owner" in response.json()
        or "repo" in response.json()
        or "error" in response.json()
    )


@pytest.mark.django_db
@patch("api.views.issues.fetch_issues")
@patch("api.views.issues.save_issues")
def test_extract_issues_success(mock_save, mock_fetch):
    mock_fetch.return_value = [{"number": 1, "title": "Test issue"}]
    client = APIClient()
    data = {"owner": "testuser", "repo": "testrepo"}
    response = client.post("/api/issues/extract/", data=data)
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["n_issues"] == 1
    mock_fetch.assert_called_once_with("testuser", "testrepo")
    mock_save.assert_called_once()
