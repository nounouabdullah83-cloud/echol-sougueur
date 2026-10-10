from rest_framework.routers import DefaultRouter

from .views import GroupViewSet, StudentViewSet, TeacherViewSet

app_name = 'AdminActions'

router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')
router.register('teachers', TeacherViewSet, basename='teacher')
router.register('groups', GroupViewSet, basename='group')

urlpatterns = router.urls