import pytest
from rest_framework.test import APIClient

from api.views import analysis as analysis_view


@pytest.mark.django_db
def test_classify_contributions_success(monkeypatch):
    classified = [{"type": "commit", "hash": "h1", "category": "dev"}]

    def fake_classify(owner, repo):
        return classified, None, 200

    monkeypatch.setattr(analysis_view, "classify_and_save_contributions", fake_classify)

    client = APIClient()
    response = client.post(
        "/api/analysis/classify_contributions/",
        {"owner": "org", "repo": "proj"},
        format="json",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["n_classified"] == len(classified)


@pytest.mark.django_db
def test_classify_contributions_handles_error(monkeypatch):
    def fake_classify(owner, repo):
        return None, {"error": "No data"}, 404

    monkeypatch.setattr(analysis_view, "classify_and_save_contributions", fake_classify)

    client = APIClient()
    response = client.post(
        "/api/analysis/classify_contributions/",
        {"owner": "org", "repo": "proj"},
        format="json",
    )

    assert response.status_code == 404
    assert response.json()["error"] == "No data"


@pytest.mark.django_db
def test_classify_contributions_percentages_from_existing_data(monkeypatch):
    classified = [
        {"type": "commit", "hash": "h1", "category": "dev"},
        {"type": "issue", "number": 1, "category": "bug"},
    ]
    commits_raw = [{"hash": "h1", "insertions": 4, "deletions": 1}]

    def fake_load(owner, repo, filename, subfolder=None):
        if filename == "contributions_classified.json" and subfolder == "ai":
            return classified
        if filename == "commits.json":
            return commits_raw
        return []

    monkeypatch.setattr(analysis_view, "load_repo_data", fake_load)

    client = APIClient()
    response = client.post(
        "/api/analysis/classify_contributions_percentages/",
        {"owner": "org", "repo": "proj"},
        format="json",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    categories = {item["category"]: item["percentage"] for item in body["percentages"]}
    assert categories["dev"] > categories["bug"]


@pytest.mark.django_db
def test_classify_contributions_percentages_triggers_classification(monkeypatch):
    classified = [{"type": "commit", "hash": "h1", "category": "dev"}]

    def fake_load(owner, repo, filename, subfolder=None):
        if filename == "contributions_classified.json" and subfolder == "ai":
            return []
        if filename == "commits.json":
            return [{"hash": "h1", "insertions": 2, "deletions": 0}]
        return []

    def fake_classify(owner, repo):
        return classified, None, 200

    monkeypatch.setattr(analysis_view, "load_repo_data", fake_load)
    monkeypatch.setattr(
        analysis_view, "classify_and_save_contributions", fake_classify
    )

    client = APIClient()
    response = client.post(
        "/api/analysis/classify_contributions_percentages/",
        {"owner": "org", "repo": "proj"},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.django_db
def test_analyze_message_quality_view(monkeypatch):
    stored = {}

    def fake_load(owner, repo, filename, subfolder=None):
        if filename == "commits.json":
            return [{"hash": "h1", "message": "Great", "files_changed": []}]
        if filename == "issues.json":
            return [{"number": 1, "title": "Bug", "body": "desc"}]
        if filename == "pulls.json":
            return [{"number": 2, "title": "PR", "body": "desc"}]
        return []

    def fake_analyze(messages):
        return [{"id": msg["id"], "score": 1} for msg in messages]

    def fake_save(owner, repo, data, filename, subfolder=None):
        stored["filename"] = filename
        stored["data"] = data

    monkeypatch.setattr(analysis_view, "load_repo_data", fake_load)
    monkeypatch.setattr(analysis_view, "analyze_all_message_quality", fake_analyze)
    monkeypatch.setattr(analysis_view, "save_repo_data", fake_save)

    client = APIClient()
    response = client.post(
        "/api/analysis/analyze_message_quality/",
        {"owner": "org", "repo": "proj", "type": "all"},
        format="json",
    )

    assert response.status_code == 200
    assert stored["filename"] == "message_quality.json"
    assert len(stored["data"]) == 3


@pytest.mark.django_db
def test_summarize_contributor_activity(monkeypatch):
    monkeypatch.setattr(
        analysis_view,
        "generate_contributor_activity_summary",
        lambda owner, repo, contributor: f"Summary for {contributor}",
    )

    client = APIClient()
    response = client.post(
        "/api/analysis/summarize_contributor_activity/",
        {"owner": "org", "repo": "proj", "contributor": "alice"},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["summary"] == "Summary for alice"


def test_classify_and_save_contributions_success(monkeypatch):
    commits_raw = [
        {"hash": "h1", "message": "Add", "files_changed": ["app.py"]},
    ]
    issues_raw = [{"number": 1, "title": "Bug", "body": "desc"}]

    def fake_load(owner, repo, filename, subfolder=None):
        if filename == "commits.json":
            return commits_raw
        if filename == "issues.json":
            return issues_raw
        if filename == "pulls.json":
            return []
        return None

    saved = {}

    monkeypatch.setattr(analysis_view, "load_repo_data", fake_load)
    monkeypatch.setattr(analysis_view, "prepare_commits", lambda data: data)
    monkeypatch.setattr(analysis_view, "prepare_issues", lambda data: data)
    monkeypatch.setattr(analysis_view, "prepare_pulls", lambda data: data)
    monkeypatch.setattr(
        analysis_view,
        "classify_all_contributions",
        lambda contributions: [{"type": "commit", "hash": "h1", "category": "dev"}],
    )
    monkeypatch.setattr(
        analysis_view,
        "save_repo_data",
        lambda owner, repo, data, filename, subfolder=None: saved.update(
            {"filename": filename, "data": data, "subfolder": subfolder}
        ),
    )

    classified, error, code = analysis_view.classify_and_save_contributions("org", "proj")

    assert code == 200 and error is None
    assert saved["filename"] == "contributions_classified.json"
    assert saved["subfolder"] == "ai"
    assert classified[0]["category"] == "dev"


def test_classify_and_save_contributions_no_data(monkeypatch):
    monkeypatch.setattr(analysis_view, "load_repo_data", lambda *args, **kwargs: None)

    classified, error, code = analysis_view.classify_and_save_contributions("org", "proj")

    assert classified is None
    assert code == 404
    assert "No contributions" in error["error"]


def test_classify_and_save_contributions_handles_exception(monkeypatch):
    def fake_load(owner, repo, filename, subfolder=None):
        if filename == "commits.json":
            return [{"hash": "h1", "message": "msg", "files_changed": []}]
        if filename == "issues.json":
            return []
        if filename == "pulls.json":
            return []
        return []

    monkeypatch.setattr(analysis_view, "load_repo_data", fake_load)
    monkeypatch.setattr(analysis_view, "prepare_commits", lambda data: data)
    monkeypatch.setattr(analysis_view, "prepare_issues", lambda data: data)
    monkeypatch.setattr(analysis_view, "prepare_pulls", lambda data: data)

    def fake_classify(_contributions):
        raise RuntimeError("boom")

    monkeypatch.setattr(analysis_view, "classify_all_contributions", fake_classify)

    classified, error, code = analysis_view.classify_and_save_contributions("org", "proj")

    assert classified is None
    assert code == 500
    assert error["error"] == "AI classification failed"
