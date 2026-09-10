from rest_framework import serializers
from .models import CMRGUser, Project, Form, FormVersion, Submission, Device, AuditLog

class CMRGUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CMRGUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'organization_name', 'server_name', 'phone_number',
            'device_id', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class FormVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormVersion
        fields = ['id', 'form', 'version_number', 'schema_json', 'changelog', 'created_at']


class FormSerializer(serializers.ModelSerializer):
    versions = FormVersionSerializer(many=True, read_only=True)
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = Form
        fields = [
            'id', 'project', 'title', 'description', 'status', 'version',
            'encryption_enabled', 'offline_enabled', 'allow_gps',
            'allow_audio_recording', 'created_at', 'updated_at',
            'versions', 'submission_count'
        ]

    def get_submission_count(self, obj):
        return obj.submissions.count()


class ProjectSerializer(serializers.ModelSerializer):
    forms = FormSerializer(many=True, read_only=True)
    total_submissions = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'code', 'description', 'status',
            'created_by', 'created_at', 'updated_at', 'forms',
            'total_submissions'
        ]

    def get_total_submissions(self, obj):
        return Submission.objects.filter(form__project=obj).count()


class SubmissionSerializer(serializers.ModelSerializer):
    form_title = serializers.CharField(source='form.title', read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id', 'client_submission_id', 'form', 'form_title',
            'version_number', 'enumerator', 'enumerator_name',
            'device_id', 'data', 'latitude', 'longitude',
            'accuracy_meters', 'audio_file', 'photo_file',
            'sync_status', 'approval_status', 'review_comments',
            'submitted_at', 'updated_at'
        ]


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = [
            'device_id', 'assigned_user', 'model', 'android_version',
            'app_version', 'battery_level', 'storage_free_mb',
            'unsynced_records', 'status', 'last_sync_at'
        ]


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'actor_name', 'action', 'role', 'details', 'ip_address', 'timestamp']
