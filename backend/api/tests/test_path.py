import os

from api.utils.common.path import get_repo_data_path


def test_get_repo_data_path_default():
    path = get_repo_data_path("user", "repo")
    assert "user__repo" in path
    assert path.endswith("user__repo")
    assert os.path.isabs(path)


def test_get_repo_data_path_with_subfolder():
    path = get_repo_data_path("user", "repo", subfolder="pulls")
    assert path.endswith(os.path.join("user__repo", "pulls"))


def test_get_repo_data_path_with_base_dir(tmp_path):
    path = get_repo_data_path("user", "repo", base_dir=tmp_path)
    assert str(tmp_path) in path
    assert path.endswith("user__repo")


def test_get_repo_data_path_with_all_args(tmp_path):
    path = get_repo_data_path(
        "user",
        "repo",
        subfolder="pulls",
        base_dir=tmp_path)
    assert path == os.path.join(str(tmp_path), "user__repo", "pulls")


def test_get_repo_data_path_owner_repo_sanitization(tmp_path):
    path = get_repo_data_path("user/name", "repo/name", base_dir=tmp_path)
    assert "user_name__repo_name" in path
