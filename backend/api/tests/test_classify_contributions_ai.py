from types import SimpleNamespace

from api.utils.ai import classify_contributions as cc


class DummyResponse:
    def __init__(self, content):
        self.choices = [SimpleNamespace(message=SimpleNamespace(content=content))]


def test_classify_contributions_with_ai_parses_json(monkeypatch):
    dummy_client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(
                create=lambda **_kwargs: DummyResponse(
                    "[{\"type\": \"commit\", \"hash\": \"h1\"}]"
                )
            )
        )
    )
    monkeypatch.setattr(cc, "client", dummy_client)

    result = cc.classify_contributions_with_ai(
        [{"type": "commit", "hash": "h1", "message": "msg", "files_changed": []}],
        model="demo",
    )

    assert result == [{"type": "commit", "hash": "h1"}]


def test_classify_contributions_with_ai_trims_noise(monkeypatch):
    noisy_response = "noise [ {\"type\": \"commit\", \"hash\": \"h2\"} ] trailing"

    dummy_client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(
                create=lambda **_kwargs: DummyResponse(noisy_response)
            )
        )
    )
    monkeypatch.setattr(cc, "client", dummy_client)

    result = cc.classify_contributions_with_ai(
        [{"type": "commit", "hash": "h2", "message": "msg", "files_changed": []}],
    )

    assert result == [{"type": "commit", "hash": "h2"}]


def test_classify_all_contributions_batches(monkeypatch):
    calls = []

    def fake_classify(batch, model):
        calls.append((len(batch), model))
        return batch

    monkeypatch.setattr(cc, "classify_contributions_with_ai", fake_classify)
    monkeypatch.setattr(cc, "BATCH_SIZE", 2)

    contributions = [
        {"type": "commit", "hash": "h1", "message": "A", "files_changed": []},
        {"type": "commit", "hash": "h2", "message": "B", "files_changed": []},
        {"type": "commit", "hash": "h3", "message": "C", "files_changed": []},
    ]

    result = cc.classify_all_contributions(contributions, model="demo")

    assert calls == [(2, "demo"), (1, "demo")]
    assert result == contributions
