from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet,
    FormViewSet,
    SubmissionViewSet,
    DeviceViewSet,
    AuditLogViewSet,
    UserViewSet,
    system_stats
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'forms', FormViewSet, basename='form')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('stats/', system_stats, name='system-stats'),
    path('', include(router.urls)),
]
