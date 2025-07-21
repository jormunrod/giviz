from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.utils.common.save import load_repo_data
from api.utils.ai.message_quality import analyze_all_message_quality
from api.utils.common.save import save_repo_data


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
