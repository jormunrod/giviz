import pytest
from rest_framework.test import APIClient
from unittest.mock import patch
import os
from api.utils.common import save


@pytest.mark.django_db
def test_get_pulls_not_found():
    client = APIClient()
    response = client.get("/api/pulls/?owner=someuser&repo=somerepo")
    assert response.status_code == 404
    assert "error" in response.json()


@pytest.mark.django_db
def test_extract_pulls_invalid():
    client = APIClient()
    response = client.post("/api/pulls/extract/", data={})
    assert response.status_code == 400
    assert (
        "owner" in response.json()
        or "repo" in response.json()
        or "error" in response.json()
    )


@pytest.mark.django_db
@patch("api.views.pulls.fetch_pulls")
@patch("api.views.pulls.save_pulls")
def test_extract_pulls_success(mock_save, mock_fetch):
    mock_fetch.return_value = [{"number": 1, "title": "Test PR"}]
    client = APIClient()
    data = {"owner": "testuser", "repo": "testrepo"}
    response = client.post("/api/pulls/extract/", data=data)
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["n_pulls"] == 1
    mock_fetch.assert_called_once_with("testuser", "testrepo")
    mock_save.assert_called_once()


@pytest.mark.django_db
def test_extract_pulls_malformed_data():
    client = APIClient()
    # owner is missing, repo is not a string
    response = client.post("/api/pulls/extract/", data={"repo": 123})
    assert response.status_code == 400
    assert "owner" in response.json() or "error" in response.json()


@pytest.mark.django_db
@patch("api.views.pulls.fetch_pulls", side_effect=Exception("GitHub API error"))
def test_extract_pulls_internal_error(mock_fetch):
    client = APIClient()
    data = {"owner": "testuser", "repo": "testrepo"}
    response = client.post("/api/pulls/extract/", data=data)
    assert response.status_code == 500
    assert "error" in response.json()


def test_save_and_load_pulls(tmp_path):
    pulls_data = [{"number": 1, "title": "PR1"}, {"number": 2, "title": "PR2"}]
    owner, repo = "user", "repo"
    # Save pulls
    save.save_repo_data(owner, repo, pulls_data, "pulls.json", base_dir=tmp_path)
    # Load pulls
    loaded = save.load_repo_data(owner, repo, "pulls.json", base_dir=tmp_path)
    assert loaded == pulls_data


def test_load_pulls_file_not_found(tmp_path):
    owner, repo = "nouser", "norepo"
    result = save.load_repo_data(owner, repo, "pulls.json", base_dir=tmp_path)
    assert result is None or result == []


def test_save_repo_data_invalid_type(tmp_path):
    owner, repo = "user", "repo"
    with pytest.raises(TypeError):
        save.save_repo_data(owner, repo, "pulls", object(), base_dir=tmp_path)
