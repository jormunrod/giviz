from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema

from api.serializers.repo import RepoQuerySerializer
from api.utils.github.issues import fetch_issues, save_issues
from api.utils.common.save import load_repo_data


@swagger_auto_schema(method="post", request_body=RepoQuerySerializer)
@api_view(["POST"])
def extract_issues_graphql(request):
    """
    Extract issues from GitHub using GraphQL and save them locally.
    """
    serializer = RepoQuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]

    try:
        issues = fetch_issues(owner, repo)
        save_issues(owner, repo, issues)
        return Response({"status": "ok", "n_issues": len(issues)})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@swagger_auto_schema(method="get", query_serializer=RepoQuerySerializer)
@api_view(["GET"])
def get_issues(request):
    """
    Get saved issues for a given repository.
    """
    serializer = RepoQuerySerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    issues = load_repo_data(owner, repo, "issues.json")
    if issues is None:
        return Response({"error": "No issues found for this repo."}, status=404)
    return Response({"issues": issues, "n_issues": len(issues)})
