from unittest.mock import patch

import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_get_commits_not_found():
    client = APIClient()
    response = client.get("/api/commits/?owner=someuser&repo=somerepo")
    assert response.status_code == 404
    assert "error" in response.json()


@pytest.mark.django_db
def test_extract_commits_invalid():
    client = APIClient()
    # Missing owner/repo
    response = client.post("/api/commits/extract/", data={})
    assert response.status_code == 400
    assert "error" in response.json() or "owner" in response.json()


@pytest.mark.django_db
@patch("api.views.commits.clone_or_update_repo")
@patch("api.views.commits.analyze_commits")
@patch("api.views.commits.save_commits")
def test_extract_commits_success(mock_save, mock_analyze, mock_clone):
    mock_analyze.return_value = [
        {"hash": "abc123", "message": "Initial commit"}]
    client = APIClient()
    data = {"owner": "testuser", "repo": "testrepo"}
    response = client.post("/api/commits/extract/", data=data)
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["commits_analyzed"] == 1
    mock_clone.assert_called_once()
    mock_analyze.assert_called_once_with("testuser", "testrepo")
    mock_save.assert_called_once()
