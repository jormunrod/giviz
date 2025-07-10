from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.serializers.repo import RepoQuerySerializer, RepoQueryWithDepthSerializer, RepoQueryWithMaxCommitsSerializer
from api.utils.common.save import load_repo_data
from api.utils.git.commits import analyze_commits, save_commits
from api.utils.git.repo import clone_or_update_repo


@swagger_auto_schema(
    method="post",
    request_body=RepoQueryWithMaxCommitsSerializer(),
)
@api_view(["POST"])
def extract_commits(request):
    """Get commits from a GitHub repository by cloning or updating the local copy."""
    serializer = RepoQueryWithMaxCommitsSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": "Missing or invalid parameters", "detail": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    git_url = f"https://github.com/{owner}/{repo}.git"
    max_commits = serializer.validated_data.get("max_commits", 50)

    try:
        depth = serializer.validated_data.get("depth", 0)
        if depth == 0:
            depth = None

        clone_or_update_repo(git_url, owner, repo, depth=depth)
        commits = analyze_commits(owner, repo)
        commits = commits[:max_commits]
        save_commits(owner, repo, commits)

    except Exception as e:
        return Response(
            {"error": "Repository analysis failed", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"status": "ok", "commits_analyzed": len(
        commits), "repo": f"{owner}/{repo}"}, )


@swagger_auto_schema(method="get", query_serializer=RepoQuerySerializer)
@api_view(["GET"])
def get_commits(request):
    """Get saved commits for a given repository.
    """
    serializer = RepoQuerySerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    commits = load_repo_data(owner, repo, "commits.json")
    if commits is None:
        return Response(
            {"error": "No commits found for this repo."}, status=404)
    return Response({"commits": commits, "n_commits": len(commits)})
