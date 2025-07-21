from rest_framework import serializers


class RepoQuerySerializer(serializers.Serializer):
    """Basic serializer for identifying a GitHub repository.
    Used in API endpoints that require only owner and repo name.
    """

    owner = serializers.CharField(help_text="Repository owner (user or organization)")
    repo = serializers.CharField(help_text="Repository name")


class RepoQueryWithDepthSerializer(RepoQuerySerializer):
    """Extends RepoQuerySerializer to include optional clone depth.
    Used when cloning the repository via Git.
    """

    depth = serializers.IntegerField(
        required=False,
        min_value=0,
        default=0,
        help_text="Depth of clone (optional). 0 means full history.",
    )


class RepoQueryWithLimitsSerializer(RepoQueryWithDepthSerializer):
    """Extends RepoQueryWithDepthSerializer to include optional limits for commits, issues, and pulls."""

    max_commits = serializers.IntegerField(
        required=False,
        min_value=1,
        default=50,
        help_text="Maximum number of commits to extract (optional).",
    )
    max_issues = serializers.IntegerField(
        required=False,
        min_value=1,
        default=50,
        help_text="Maximum number of issues to extract (optional).",
    )
    max_pulls = serializers.IntegerField(
        required=False,
        min_value=1,
        default=50,
        help_text="Maximum number of pull requests to extract (optional).",
    )


class RepoQueryWithMaxCommitsSerializer(RepoQueryWithDepthSerializer):
    """Extends RepoQueryWithDepthSerializer to include an optional limit for commits only."""

    max_commits = serializers.IntegerField(
        required=False,
        min_value=1,
        default=50,
        help_text="Maximum number of commits to extract (optional).",
    )


class RepoQueryWithMaxIssuesSerializer(RepoQuerySerializer):
    """Extends RepoQuerySerializer to include an optional limit for issues only."""

    max_issues = serializers.IntegerField(
        required=False,
        min_value=1,
        default=50,
        help_text="Maximum number of issues to extract (optional).",
    )


class RepoQueryWithMaxPullsSerializer(RepoQuerySerializer):
    """Extends RepoQuerySerializer to include an optional limit for pull requests only."""

    max_pulls = serializers.IntegerField(
        required=False,
        min_value=1,
        default=50,
        help_text="Maximum number of pull requests to extract (optional).",
    )


class MessageQualityQuerySerializer(serializers.Serializer):
    """Serializer for message quality analysis endpoint."""

    owner = serializers.CharField(help_text="Repository owner (user or organization)")
    repo = serializers.CharField(help_text="Repository name")
    type = serializers.ChoiceField(
        choices=["commit", "issue", "pr", "all"],
        default="commit",
        help_text="Type of message to analyze: commit, issue, pr, or all.",
    )
