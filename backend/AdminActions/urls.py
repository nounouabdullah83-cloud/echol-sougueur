from rest_framework.routers import DefaultRouter

from .views import GroupViewSet, StudentViewSet, TeacherViewSet, teacherRevenues

app_name = 'AdminActions'

router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')
router.register('teachers', TeacherViewSet, basename='teacher')
router.register('groups', GroupViewSet, basename='group')
router.register('teacher-revenues', teacherRevenues, basename='teacher-revenue')

urlpatterns = router.urls