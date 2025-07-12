from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from api.serializers.repo import RepoQuerySerializer
from backend.api.utils.common.merge import merge_contributions


@swagger_auto_schema(method="post", request_body=RepoQuerySerializer)
@api_view(["POST"])
def merge_contributions_view(request):
    """Merge contribution types and categories for a given repo and save typed files in the classification folder."""
    serializer = RepoQuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": "Missing or invalid parameters", "detail": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    try:
        merge_contributions(owner, repo)
    except FileNotFoundError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response(
        {"status": "ok", "message": f"Contributions merged for {owner}/{repo}"}
    )
