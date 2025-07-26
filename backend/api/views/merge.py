from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from api.serializers.repo import RepoQuerySerializer
from api.utils.common.merge import merge_contributions
from api.utils.common.save import load_repo_data


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


def get_contrib_id(contrib, name_to_login=None):
    if isinstance(contrib, dict):
        login = contrib.get("login") or contrib.get("username")
        name = contrib.get("name")
        if login:
            return login
        if name and name_to_login and name in name_to_login:
            return name_to_login[name]
        return name or str(contrib)
    if name_to_login and contrib in name_to_login:
        return name_to_login[contrib]
    return str(contrib)


@swagger_auto_schema(method="post", request_body=RepoQuerySerializer)
@api_view(["POST"])
def contributors_by_category_view(request):
    """Returns, for each contributor, grouped by category, the hashes or identifiers of each issue, pull request, or commit they have made."""
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
    # Read unified files
    commits = (
        load_repo_data(owner, repo, "commits_typed.json", subfolder="merged") or []
    )
    issues = load_repo_data(owner, repo, "issues_typed.json", subfolder="merged") or []
    pulls = load_repo_data(owner, repo, "pulls_typed.json", subfolder="merged") or []
    contributors = (
        load_repo_data(owner, repo, "contributors_typed.json", subfolder="merged") or []
    )
    # Build name to login mapping
    name_to_login = {}
    for c in contributors:
        login = c.get("login") or c.get("username")
        name = c.get("name")
        if login and name:
            name_to_login[name] = login
    result = {}

    def add_contrib(contrib, category, id_, type_):
        contrib_id = get_contrib_id(contrib, name_to_login)
        if not contrib_id:
            return
        if contrib_id not in result:
            result[contrib_id] = {}
        if category not in result[contrib_id]:
            result[contrib_id][category] = {"commits": [], "issues": [], "pulls": []}
        result[contrib_id][category][type_].append(id_)

    for c in commits:
        contrib = c.get("author")
        category = c.get("category", "uncategorized")
        hash_ = c.get("hash")
        add_contrib(contrib, category, hash_, "commits")
    for i in issues:
        contrib = i.get("author")
        category = i.get("category", "uncategorized")
        num = i.get("number")
        add_contrib(contrib, category, num, "issues")
    for p in pulls:
        contrib = p.get("author")
        category = p.get("category", "uncategorized")
        num = p.get("number")
        add_contrib(contrib, category, num, "pulls")
    return Response({"status": "ok", "contributors": result})


@swagger_auto_schema(method="post", request_body=RepoQuerySerializer)
@api_view(["POST"])
def contributors_effort_by_category_view(request):
    """Returns, for each contributor and category, the effort for commits (count × lines changed), counts for issues and pulls, and normalized dedication as a field inside each category."""
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
    # Read unified files
    commits = (
        load_repo_data(owner, repo, "commits_typed.json", subfolder="merged") or []
    )
    issues = load_repo_data(owner, repo, "issues_typed.json", subfolder="merged") or []
    pulls = load_repo_data(owner, repo, "pulls_typed.json", subfolder="merged") or []
    contributors = (
        load_repo_data(owner, repo, "contributors_typed.json", subfolder="merged") or []
    )
    name_to_login = {}
    for c in contributors:
        login = c.get("login") or c.get("username")
        name = c.get("name")
        if login and name:
            name_to_login[name] = login
    result = {}

    def add_effort(contrib, category, value, type_):
        if category == "uncategorized" or category is None:
            return
        contrib_id = get_contrib_id(contrib, name_to_login)
        if not contrib_id:
            return
        if contrib_id not in result:
            result[contrib_id] = {}
        if category not in result[contrib_id]:
            result[contrib_id][category] = {"commits": 0, "issues": 0, "pulls": 0}
        result[contrib_id][category][type_] += value

    for c in commits:
        contrib = c.get("author")
        category = c.get("category", "uncategorized")
        lines = c.get("insertions", 0) + c.get("deletions", 0)
        if not lines:
            lines = 1  # fallback if no line info
        add_effort(contrib, category, lines, "commits")
    for i in issues:
        contrib = i.get("author")
        category = i.get("category", "uncategorized")
        add_effort(contrib, category, 1, "issues")
    for p in pulls:
        contrib = p.get("author")
        category = p.get("category", "uncategorized")
        add_effort(contrib, category, 1, "pulls")
    # Calculate dedication for each contributor/category
    for contrib_id, cats in result.items():
        total = sum(
            vals["commits"] + vals["issues"] + vals["pulls"] for vals in cats.values()
        )
        if total == 0:
            continue
        for cat, vals in cats.items():
            vals["dedication"] = round(
                (vals["commits"] + vals["issues"] + vals["pulls"]) / total, 4
            )
    return Response({"status": "ok", "contributors": result})


@swagger_auto_schema(method="post", request_body=RepoQuerySerializer)
@api_view(["POST"])
def contributors_message_quality_view(request):
    serializer = RepoQuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": "Missing or invalid parameters", "detail": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    owner = serializer.validated_data["owner"]
    repo = serializer.validated_data["repo"]
    try:
        data = load_repo_data(owner, repo, "message_quality.json", subfolder="ai")
        if not data:
            return Response({"error": "No message quality data found."}, status=404)
        return Response({"status": "ok", "data": data})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
