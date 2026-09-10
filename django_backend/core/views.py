import json
import uuid
from datetime import datetime
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count
from django.http import HttpResponse

from .models import CMRGUser, Project, Form, FormVersion, Submission, Device, AuditLog
from .serializers import (
    CMRGUserSerializer,
    ProjectSerializer,
    FormSerializer,
    FormVersionSerializer,
    SubmissionSerializer,
    DeviceSerializer,
    AuditLogSerializer
)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        AuditLog.objects.create(
            actor_name=self.request.user.username,
            action='PROJECT_CREATE',
            role=self.request.user.role,
            details=f"Created project: {project.name} [{project.code}]",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )


class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.all().order_by('-created_at')
    serializer_class = FormSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        form = serializer.save()
        AuditLog.objects.create(
            actor_name=self.request.user.username,
            action='FORM_CREATE',
            role=self.request.user.role,
            details=f"Created form: {form.title} (v{form.version})",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    @action(detail=True, methods=['get'])
    def schema(self, request, pk=None):
        form = self.get_object()
        latest_version = form.versions.first()
        if latest_version:
            return Response(latest_version.schema_json)
        return Response({'fields': []})


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all().order_by('-submitted_at')
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        form_id = self.request.query_params.get('form_id')
        if form_id:
            qs = qs.filter(form_id=form_id)
        approval = self.request.query_params.get('approval_status')
        if approval:
            qs = qs.filter(approval_status=approval)
        return qs

    def perform_create(self, serializer):
        sub = serializer.save(
            enumerator=self.request.user if self.request.user.is_authenticated else None,
            enumerator_name=self.request.user.get_full_name() or self.request.user.username
        )
        AuditLog.objects.create(
            actor_name=self.request.user.username,
            action='SUBMISSION_RECEIVED',
            role=self.request.user.role,
            details=f"Received submission {sub.id} for form {sub.form.title}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    @action(detail=False, methods=['post'], url_path='bulk-sync')
    def bulk_sync(self, request):
        """
        Syncs queued submissions uploaded from CMRG Collect mobile APK.
        Supports idempotency via client_submission_id.
        """
        payload = request.data
        submissions_data = payload.get('submissions', [])
        synced_ids = []
        errors = []

        for item in submissions_data:
            client_sub_id = item.get('client_submission_id')
            form_id = item.get('form_id')

            # Idempotency check: don't duplicate if already synced
            if client_sub_id and Submission.objects.filter(client_submission_id=client_sub_id).exists():
                synced_ids.append(client_sub_id)
                continue

            try:
                form = Form.objects.get(id=form_id)
                sub = Submission.objects.create(
                    id=f"sub_{uuid.uuid4().hex[:12]}",
                    client_submission_id=client_sub_id,
                    form=form,
                    version_number=item.get('version_number', form.version),
                    enumerator=request.user if request.user.is_authenticated else None,
                    enumerator_name=item.get('enumerator_name', request.user.username),
                    device_id=item.get('device_id', ''),
                    data=item.get('data', {}),
                    latitude=item.get('latitude'),
                    longitude=item.get('longitude'),
                    accuracy_meters=item.get('accuracy_meters'),
                    sync_status='SYNCED',
                    approval_status='PENDING'
                )
                synced_ids.append(client_sub_id or sub.id)
            except Exception as e:
                errors.append({'client_submission_id': client_sub_id, 'error': str(e)})

        return Response({
            'status': 'ok',
            'synced_count': len(synced_ids),
            'synced_ids': synced_ids,
            'errors': errors
        })


class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all().order_by('-last_sync_at')
    serializer_class = DeviceSerializer
    permission_classes = [permissions.IsAuthenticated]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserViewSet(viewsets.ModelViewSet):
    queryset = CMRGUser.objects.all().order_by('-created_at')
    serializer_class = CMRGUserSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def system_stats(request):
    total_submissions = Submission.objects.count()
    active_forms = Form.objects.filter(status='ACTIVE').count()
    active_projects = Project.objects.filter(status='ACTIVE').count()
    devices_online = Device.objects.filter(status='ONLINE').count()
    pending_reviews = Submission.objects.filter(approval_status='PENDING').count()

    return Response({
        'totalSubmissions': total_submissions,
        'activeForms': active_forms,
        'activeProjects': active_projects,
        'devicesOnline': devices_online,
        'pendingReviews': pending_reviews,
        'syncRatePercent': 99.8,
        'timestamp': datetime.now().isoformat()
    })
