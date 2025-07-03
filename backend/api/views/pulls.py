from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema

from api.serializers.repo import RepoQuerySerializer
from api.utils.github.pulls import fetch_pulls, save_pulls
from api.utils.common.save import load_repo_data


@swagger_auto_schema(method="post", request_body=RepoQuerySerializer)
@api_view(["POST"])
def extract_pulls_graphql(request):
    """
    Extract pull requests from GitHub using GraphQL and save them locally.
    """
    serializer = RepoQuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]

    try:
        pulls = fetch_pulls(owner, repo)
        save_pulls(owner, repo, pulls)
        return Response({"status": "ok", "n_pulls": len(pulls)})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@swagger_auto_schema(method="get", query_serializer=RepoQuerySerializer)
@api_view(["GET"])
def get_pulls(request):
    """
    Get saved pull requests for a given repository.
    """
    serializer = RepoQuerySerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    pulls = load_repo_data(owner, repo, "pulls.json")
    if pulls is None:
        return Response({"error": "No pull requests found for this repo."}, status=404)
    return Response({"pulls": pulls, "n_pulls": len(pulls)})
