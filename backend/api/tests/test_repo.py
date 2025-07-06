from unittest.mock import patch

import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_extract_all_invalid():
    client = APIClient()
    response = client.post("/api/repo/extract_all/", data={})
    assert response.status_code == 400
    assert (
        "owner" in response.json()
        or "repo" in response.json()
        or "error" in response.json()
    )


@pytest.mark.django_db
@patch("api.views.repo.clone_or_update_repo")
@patch("api.views.repo.analyze_commits")
@patch("api.views.repo.save_commits")
@patch("api.views.repo.fetch_issues")
@patch("api.views.repo.save_issues")
@patch("api.views.repo.fetch_pulls")
@patch("api.views.repo.save_pulls")
@patch("api.views.repo.fetch_contributors")
@patch("api.views.repo.save_contributors")
def test_extract_all_success(
    mock_save_contrib,
    mock_fetch_contrib,
    mock_save_pulls,
    mock_fetch_pulls,
    mock_save_issues,
    mock_fetch_issues,
    mock_save_commits,
    mock_analyze_commits,
    mock_clone,
):
    mock_analyze_commits.return_value = [
        {"hash": "abc123", "message": "Initial commit"},
    ]
    mock_fetch_issues.return_value = [{"number": 1, "title": "Test issue"}]
    mock_fetch_pulls.return_value = [{"number": 1, "title": "Test PR"}]
    mock_fetch_contrib.return_value = [
        {"login": "testuser", "name": "Test User"}]
    client = APIClient()
    data = {"owner": "testuser", "repo": "testrepo"}
    response = client.post("/api/repo/extract_all/", data=data)
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "ok"
    assert result["summary"]["commits"] == 1
    assert result["summary"]["issues"] == 1
    assert result["summary"]["pulls"] == 1
    assert result["summary"]["contributors"] == 1
    mock_clone.assert_called_once()
    mock_analyze_commits.assert_called_once_with("testuser", "testrepo")
    mock_save_commits.assert_called_once()
    mock_fetch_issues.assert_called_once_with("testuser", "testrepo")
    mock_save_issues.assert_called_once()
    mock_fetch_pulls.assert_called_once_with("testuser", "testrepo")
    mock_save_pulls.assert_called_once()
    mock_fetch_contrib.assert_called_once_with("testuser", "testrepo")
    mock_save_contrib.assert_called_once()
