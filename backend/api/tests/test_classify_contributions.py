from api.utils.ai.classify_contributions import classify_all_contributions

contributions = [
    {
        "type": "commit",
        "hash": "abc123",
        "message": "Add login feature",
        "files_changed": ["./login.py", "./auth.py"],
    },
    {
        "type": "commit",
        "hash": "def456",
        "message": "Add unit tests for login",
        "files_changed": ["./test_login.py"],
    },
    {
        "type": "commit",
        "hash": "ghi789",
        "message": "Update README and docs",
        "files_changed": ["./README.md", "./docs/auth.md"],
    },
    {
        "type": "commit",
        "hash": "xyz000",
        "message": "Bump dependencies and fix lint errors",
        "files_changed": ["./requirements.txt", "./.github/workflows/ci.yml"],
    },
    {
        "type": "issue",
        "number": 1,
        "title": "Crash on invalid input",
        "body": "App crashes when given empty string",
    },
    {
        "type": "pull",
        "number": 2,
        "title": "Optimize image loading",
        "body": "Use lazy-loading and caching for images",
    },
]


def test_classify_all_contributions(monkeypatch):
    # Patch the OpenAI call to avoid real API usage
    def fake_classify_contributions_with_ai(batch, model="gpt-4.1-nano"):
        # Return fixed categories for the mock data
        return [
            {"type": "commit", "hash": "abc123", "category": "development"},
            {"type": "commit", "hash": "def456", "category": "testing"},
            {"type": "commit", "hash": "ghi789", "category": "documentation"},
            {"type": "commit", "hash": "xyz000", "category": "chore"},
            {"type": "issue", "number": 1, "category": "bugfix"},
            {"type": "pull", "number": 2, "category": "performance"},
        ]

    monkeypatch.setattr(
        "api.utils.ai.classify_contributions.classify_contributions_with_ai",
        fake_classify_contributions_with_ai,
    )

    result = classify_all_contributions(contributions)
    assert len(result) == 6
    assert result[0]["category"] == "development"
    assert result[1]["category"] == "testing"
    assert result[2]["category"] == "documentation"
    assert result[3]["category"] == "chore"
    assert result[4]["category"] == "bugfix"
    assert result[5]["category"] == "performance"
