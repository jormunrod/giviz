import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_ping():
    client = APIClient()
    response = client.get("/api/ping/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
