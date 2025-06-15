from rest_framework import serializers


class RepoQuerySerializer(serializers.Serializer):
    """
    Basic serializer for identifying a GitHub repository.
    Used in API endpoints that require only owner and repo name.
    """

    owner = serializers.CharField(help_text="Repository owner (user or organization)")
    repo = serializers.CharField(help_text="Repository name")


class RepoQueryWithDepthSerializer(RepoQuerySerializer):
    """
    Extends RepoQuerySerializer to include optional clone depth.
    Used when cloning the repository via Git.
    """

    depth = serializers.IntegerField(
        required=False,
        min_value=0,
        default=0,
        help_text="Depth of clone (optional). 0 means full history.",
    )
