from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.utils.common.save import load_repo_data

from api.serializers.repo import MessageQualityQuerySerializer


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

    results = []
    types_to_check = []
    if msg_type == "all":
        types_to_check = ["commit", "issue", "pr"]
    else:
        types_to_check = [msg_type]

    for t in types_to_check:
        if t == "commit":
            commits = load_repo_data(owner, repo, "commits.json") or []
            for c in commits:
                results.append(
                    {
                        "id": c.get("hash"),
                        "type": "commit",
                        "text": c.get("message"),
                        "score": None,
                        "suggestions": [],
                    }
                )
        elif t == "issue":
            issues = load_repo_data(owner, repo, "issues.json") or []
            for i in issues:
                results.append(
                    {
                        "id": i.get("number"),
                        "type": "issue",
                        "text": i.get("title", "") + "\n" + i.get("body", ""),
                        "score": None,
                        "suggestions": [],
                    }
                )
        elif t == "pr":
            prs = load_repo_data(owner, repo, "pulls.json") or []
            for p in prs:
                results.append(
                    {
                        "id": p.get("number"),
                        "type": "pr",
                        "text": p.get("title", "") + "\n" + p.get("body", ""),
                        "score": None,
                        "suggestions": [],
                    }
                )

    return Response({"status": "ok", "results": results})
