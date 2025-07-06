from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.serializers.repo import RepoQueryWithDepthSerializer
from api.utils.common.save import load_repo_data, save_repo_data
from api.utils.common.prepare_data import prepare_commits, prepare_issues, prepare_pulls
from api.utils.ai.classify_contributions import classify_all_contributions


def classify_and_save_contributions(owner, repo):
    commits = load_repo_data(owner, repo, "commits.json") or []
    issues = load_repo_data(owner, repo, "issues.json") or []
    pulls = load_repo_data(owner, repo, "pulls.json") or []
    commits = [
        dict(
            type="commit",
            hash=c["hash"],
            message=c["message"],
            files_changed=c["files_changed"],
        )
        for c in prepare_commits(commits)
    ]
    issues = [
        dict(type="issue", number=i["number"], title=i["title"], body=i["body"])
        for i in prepare_issues(issues)
    ]
    pulls = [
        dict(type="pull", number=p["number"], title=p["title"], body=p["body"])
        for p in prepare_pulls(pulls)
    ]
    contributions = commits + issues + pulls
    if not contributions:
        return None, {"error": "No contributions found for this repo."}, 404
    try:
        classified = classify_all_contributions(contributions)
        save_repo_data(
            owner, repo, classified, "contributions_classified.json", subfolder="ai"
        )
        return classified, None, 200
    except Exception as e:
        return None, {"error": "AI classification failed", "detail": str(e)}, 500


@swagger_auto_schema(method="post", request_body=RepoQueryWithDepthSerializer())
@api_view(["POST"])
def classify_contributions(request):
    """
    Classify all repository contributions (commits, issues, pulls) into categories using AI and save the result.
    """
    serializer = RepoQueryWithDepthSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": "Missing or invalid parameters", "detail": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    classified, error, code = classify_and_save_contributions(owner, repo)
    if error:
        return Response(error, status=code)
    return Response(
        {"status": "ok", "n_classified": len(classified), "classified": classified}
    )


@swagger_auto_schema(method="post", request_body=RepoQueryWithDepthSerializer())
@api_view(["POST"])
def classify_contributions_percentages(request):
    """
    Classifies contributions and returns the percentage for each category.
    First tries to read contributions_classified.json, if it does not exist it generates it.
    """
    serializer = RepoQueryWithDepthSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": "Missing or invalid parameters", "detail": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    classified = load_repo_data(
        owner, repo, "contributions_classified.json", subfolder="ai"
    )
    if not classified:
        classified, error, code = classify_and_save_contributions(owner, repo)
        if error:
            return Response(error, status=code)
    if not classified:
        return Response(
            {"error": "No classified data found after classification."}, status=500
        )
    # Calculate percentages
    total = len(classified)
    counts = {}
    for item in classified:
        cat = item.get("category", "others")
        counts[cat] = counts.get(cat, 0) + 1
    percentages = [
        {"category": cat, "percentage": round((count / total) * 100, 2)}
        for cat, count in counts.items()
    ]
    return Response({"status": "ok", "percentages": percentages})
