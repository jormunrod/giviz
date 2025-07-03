from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view
from rest_framework.response import Response


@swagger_auto_schema(
    method="get",
)
@api_view(["GET"])
def ping(request):
    """Simple endpoint to check if the API is running."""
    return Response({"status": "ok"})
