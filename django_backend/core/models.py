import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class CMRGUser(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Central Administrator'),
        ('PROJECT_MANAGER', 'Project Manager'),
        ('SUPERVISOR', 'Field Supervisor'),
        ('ENUMERATOR', 'Mobile Field Enumerator'),
        ('DATA_ANALYST', 'Data Analyst / Statistician'),
    ]

    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"usr_{uuid.uuid4().hex[:12]}")
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default='ENUMERATOR')
    organization_name = models.CharField(max_length=255, default='CMRG Ltd.')
    server_name = models.CharField(max_length=128, default='cmrg')
    phone_number = models.CharField(max_length=32, blank=True, null=True)
    device_id = models.CharField(max_length=128, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Project(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active / Collecting'),
        ('PAUSED', 'Paused'),
        ('COMPLETED', 'Completed'),
        ('ARCHIVED', 'Archived'),
    ]

    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"prj_{uuid.uuid4().hex[:8]}")
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=64, unique=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='ACTIVE')
    created_by = models.ForeignKey(CMRGUser, on_delete=models.SET_NULL, null=True, related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} [{self.code}]"


class Form(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft / In Design'),
        ('ACTIVE', 'Active / Accepting Submissions'),
        ('PAUSED', 'Paused'),
        ('ARCHIVED', 'Archived'),
    ]

    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"frm_{uuid.uuid4().hex[:8]}")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='forms')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='ACTIVE')
    version = models.IntegerField(default=1)
    encryption_enabled = models.BooleanField(default=True)
    offline_enabled = models.BooleanField(default=True)
    allow_gps = models.BooleanField(default=True)
    allow_audio_recording = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} (v{self.version})"


class FormVersion(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"ver_{uuid.uuid4().hex[:8]}")
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    schema_json = models.JSONField(default=dict)
    changelog = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('form', 'version_number')
        ordering = ['-version_number']

    def __str__(self):
        return f"{self.form.title} - v{self.version_number}"


class Submission(models.Model):
    SYNC_CHOICES = [
        ('SYNCED', 'Synced to Server'),
        ('QUEUED', 'Queued in Field Device'),
        ('FAILED', 'Sync Error'),
    ]
    APPROVAL_CHOICES = [
        ('PENDING', 'Pending Supervisor Review'),
        ('APPROVED', 'Approved / Verified'),
        ('REJECTED', 'Flagged / Rejected'),
    ]

    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"sub_{uuid.uuid4().hex[:12]}")
    client_submission_id = models.CharField(max_length=128, blank=True, null=True, db_index=True)
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='submissions')
    version_number = models.IntegerField(default=1)
    enumerator = models.ForeignKey(CMRGUser, on_delete=models.SET_NULL, null=True, related_name='submissions')
    enumerator_name = models.CharField(max_length=255, blank=True)
    device_id = models.CharField(max_length=128, blank=True)
    
    # Core Data Payload
    data = models.JSONField(default=dict)

    # Telemetry and attachments
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    accuracy_meters = models.FloatField(null=True, blank=True)
    audio_file = models.FileField(upload_to='submissions/audio/', null=True, blank=True)
    photo_file = models.FileField(upload_to='submissions/photos/', null=True, blank=True)

    # Status
    sync_status = models.CharField(max_length=32, choices=SYNC_CHOICES, default='SYNCED')
    approval_status = models.CharField(max_length=32, choices=APPROVAL_CHOICES, default='PENDING')
    review_comments = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Submission {self.id} for {self.form.title}"


class Device(models.Model):
    STATUS_CHOICES = [
        ('ONLINE', 'Connected / Active'),
        ('IDLE', 'Idle / Synced recently'),
        ('OFFLINE', 'Offline / In Field'),
    ]

    device_id = models.CharField(max_length=128, primary_key=True)
    assigned_user = models.ForeignKey(CMRGUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='devices')
    model = models.CharField(max_length=128, default='Android Device')
    android_version = models.CharField(max_length=32, default='14.0')
    app_version = models.CharField(max_length=32, default='v2.4.0')
    battery_level = models.IntegerField(default=100)
    storage_free_mb = models.IntegerField(default=16384)
    unsynced_records = models.IntegerField(default=0)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='ONLINE')
    last_sync_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.device_id} ({self.model})"


class AuditLog(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=lambda: f"log_{uuid.uuid4().hex[:12]}")
    actor_name = models.CharField(max_length=255)
    action = models.CharField(max_length=64)
    role = models.CharField(max_length=64, blank=True)
    details = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.actor_name}: {self.action}"
