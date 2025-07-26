from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.serializers.repo import (
    MessageQualityQuerySerializer,
    RepoQueryWithDepthSerializer,
)
from api.utils.common.save import load_repo_data, save_repo_data
from api.utils.common.prepare_data import prepare_commits, prepare_issues, prepare_pulls
from api.utils.ai.classify_contributions import classify_all_contributions
from api.utils.ai.message_quality import analyze_all_message_quality


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
    Classifies contributions and returns the percentage for each category, weighted by lines changed (additions + deletions) for commits.
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
    # Load commits.json for line stats
    commits_raw = load_repo_data(owner, repo, "commits.json") or []
    commit_lines = {
        c["hash"]: c.get("insertions", 0) + c.get("deletions", 0)
        for c in commits_raw
        if "hash" in c
    }
    # Calculate weighted effort per category
    effort = {}
    total_effort = 0
    for item in classified:
        cat = item.get("category", "others")
        if item["type"] == "commit":
            lines = commit_lines.get(item["hash"], 1)  # fallback to 1 if not found
            effort[cat] = effort.get(cat, 0) + lines
            total_effort += lines
        else:
            # For issues/pulls, count as 1 (or set to 0 to ignore)
            effort[cat] = effort.get(cat, 0) + 1
            total_effort += 1
    if total_effort == 0:
        return Response({"error": "No effort data found."}, status=500)
    percentages = [
        {"category": cat, "percentage": round((val / total_effort) * 100, 2)}
        for cat, val in effort.items()
    ]
    return Response(
        {"status": "ok", "percentages": percentages, "classified": classified}
    )


@swagger_auto_schema(method="post", request_body=MessageQualityQuerySerializer)
@api_view(["POST"])
def analyze_message_quality(request):
    """Analyze the quality of commit, issue, or PR messages for a repo using OpenAI."""
    serializer = MessageQualityQuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": "Missing or invalid parameters", "detail": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    msg_type = serializer.validated_data["type"]
    max_messages = serializer.validated_data.get("max_messages", 0)

    messages = []
    types_to_check = ["commit", "issue", "pr"] if msg_type == "all" else [msg_type]

    for t in types_to_check:
        if t == "commit":
            commits = load_repo_data(owner, repo, "commits.json") or []
            for c in commits:
                messages.append(
                    {
                        "id": c.get("hash"),
                        "type": "commit",
                        "text": c.get("message", ""),
                    }
                )
        elif t == "issue":
            issues = load_repo_data(owner, repo, "issues.json") or []
            for i in issues:
                text = (i.get("title", "") + "\n" + i.get("body", "")).strip()
                messages.append({"id": i.get("number"), "type": "issue", "text": text})
        elif t == "pr":
            prs = load_repo_data(owner, repo, "pulls.json") or []
            for p in prs:
                text = (p.get("title", "") + "\n" + p.get("body", "")).strip()
                messages.append({"id": p.get("number"), "type": "pr", "text": text})

    if max_messages > 0:
        messages = messages[:max_messages]

    results = analyze_all_message_quality(messages)

    if msg_type == "all":
        filename = "message_quality.json"
    else:
        filename = f"message_quality_{msg_type}.json"
    save_repo_data(owner, repo, results, filename, subfolder="ai")

    return Response({"status": "ok", "results": results})
