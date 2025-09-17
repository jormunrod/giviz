from types import SimpleNamespace

from api.utils.ai import message_quality as mq


class DummyResponse:
    def __init__(self, content):
        self.choices = [SimpleNamespace(message=SimpleNamespace(content=content))]


def test_analyze_message_quality_with_ai_parses_json(monkeypatch):
    def fake_create(*_args, **_kwargs):
        return DummyResponse("[{\"id\": 1, \"score\": 9}]")

    dummy_client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )
    monkeypatch.setattr(mq, "client", dummy_client)

    result = mq.analyze_message_quality_with_ai(
        [{"id": 1, "type": "commit", "text": "Good job"}],
        model="test-model",
    )

    assert result == [{"id": 1, "score": 9}]


def test_analyze_message_quality_with_ai_sanitizes_response(monkeypatch):
    messy = "Noise before [ {\"id\": 2, \"score\": 5, } ] trailing"

    def fake_create(*_args, **_kwargs):
        return DummyResponse(messy)

    dummy_client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )
    monkeypatch.setattr(mq, "client", dummy_client)

    result = mq.analyze_message_quality_with_ai(
        [{"id": 2, "type": "issue", "text": "Needs work"}],
    )

    assert result == [{"id": 2, "score": 5}]


def test_analyze_all_message_quality_batches(monkeypatch):
    calls = []

    def fake_analyze(batch, model):
        calls.append((tuple(item["id"] for item in batch), model))
        return [{"id": item["id"], "score": 1} for item in batch]

    monkeypatch.setattr(mq, "analyze_message_quality_with_ai", fake_analyze)
    monkeypatch.setattr(mq, "BATCH_SIZE", 2)

    messages = [
        {"id": 1, "type": "commit", "text": "a"},
        {"id": 2, "type": "commit", "text": "b"},
        {"id": 3, "type": "commit", "text": "c"},
    ]

    results = mq.analyze_all_message_quality(messages, model="demo")

    assert len(calls) == 2
    assert calls[0] == ((1, 2), "demo")
    assert calls[1] == ((3,), "demo")
    assert [r["id"] for r in results] == [1, 2, 3]
