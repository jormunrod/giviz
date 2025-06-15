from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.serializers.repo import RepoQueryWithDepthSerializer

from api.utils.git.repo import clone_or_update_repo
from api.utils.git.commits import analyze_commits, save_commits


@swagger_auto_schema(
    method="post",
    request_body=RepoQueryWithDepthSerializer(),
)
@api_view(["POST"])
def extract_commits(request):
    """
    Get commits from a GitHub repository by cloning or updating the local copy.
    """
    serializer = RepoQueryWithDepthSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": "Missing or invalid parameters", "detail": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    git_url = f"https://github.com/{owner}/{repo}.git"

    try:
        depth = serializer.validated_data.get("depth", 0)
        if depth == 0:
            depth = None

        clone_or_update_repo(git_url, owner, repo, depth=depth)
        commits = analyze_commits(owner, repo)
        save_commits(owner, repo, commits)

    except Exception as e:
        return Response(
            {"error": "Repository analysis failed", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {"status": "ok", "commits_analyzed": len(commits), "repo": f"{owner}/{repo}"}
    )
