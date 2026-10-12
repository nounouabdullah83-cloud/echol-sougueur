from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Group, Student, Teacher
from .serializers import GroupSerializer, StudentSerializer, TeacherSerializer


class StudentViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for students. Requires authentication (global default)."""

    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    search_fields = ('first_name', 'last_name')
    ordering_fields = ('last_name', 'first_name', 'registration_date')


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
    search_fields = ('group_number', 'subject')
    ordering_fields = ('group_number',)

    @action(detail=True, methods=['post'])
    def add_student(self, request, pk=None):
        """Create a student and add them to this group's `students` (M2M)."""
        group = self.get_object()
        serializer = StudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        group.students.add(student)
        group_serializer = GroupSerializer(
            group, context=self.get_serializer_context()
        )
        return Response(group_serializer.data, status=status.HTTP_201_CREATED)