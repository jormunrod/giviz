from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema

from api.serializers.repo import RepoQuerySerializer
from api.utils.github.contributors import fetch_contributors, save_contributors
from api.utils.common.save import load_repo_data


@swagger_auto_schema(method="post", request_body=RepoQuerySerializer)
@api_view(["POST"])
def extract_contributors_graphql(request):
    """
    Extract contributors from GitHub using GraphQL and save them locally.
    """
    serializer = RepoQuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]

    try:
        contributors = fetch_contributors(owner, repo)
        save_contributors(owner, repo, contributors)
        return Response({"status": "ok", "n_contributors": len(contributors)})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@swagger_auto_schema(method="get", query_serializer=RepoQuerySerializer)
@api_view(["GET"])
def get_contributors(request):
    """
    Get saved contributors for a given repository.
    """
    serializer = RepoQuerySerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    contributors = load_repo_data(owner, repo, "contributors.json")
    if contributors is None:
        return Response({"error": "No contributors found for this repo."}, status=404)
    return Response({"contributors": contributors, "n_contributors": len(contributors)})
