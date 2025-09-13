from rest_framework import serializers


class RepoStatusFileInfoSerializer(serializers.Serializer):
    exists = serializers.BooleanField()
    mtime_epoch = serializers.IntegerField(required=False)
    size = serializers.IntegerField(required=False)


class RepoStatusSerializer(serializers.Serializer):
    available = serializers.BooleanField()
    last_updated = serializers.DateTimeField(allow_null=True)
    files = serializers.DictField(child=RepoStatusFileInfoSerializer())
    stale_hint = serializers.BooleanField()
