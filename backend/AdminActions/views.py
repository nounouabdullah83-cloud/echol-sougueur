from rest_framework import viewsets

from .models import Group, Student, Teacher
from .serializers import GroupSerializer, StudentSerializer, TeacherSerializer


class StudentViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for students. Requires authentication (global default)."""

    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    search_fields = ('first_name', 'last_name')
    ordering_fields = ('last_name', 'first_name', 'registration_date', 'level')


class TeacherViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for teachers. Requires authentication (global default)."""

    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    search_fields = ('full_name',)
    ordering_fields = ('full_name',)


class GroupViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for groups. Requires authentication (global default)."""

    queryset = Group.objects.prefetch_related('students').select_related('teacher').all()
    serializer_class = GroupSerializer
    search_fields = ('group_number',)
    ordering_fields = ('group_number',)