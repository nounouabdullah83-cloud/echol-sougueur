from decimal import Decimal

from django.db.models import Count, DecimalField, OuterRef, Subquery, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Group,
    Student,
    Teacher,
    TeacherRevenueEntry,
    accrue_subscription_revenue,
    add_months,
    deduct_group_revenue,
)
from .serializers import (
    GroupSerializer,
    StudentSerializer,
    TeacherRevenueEntrySerializer,
    TeacherRevenueSerializer,
    TeacherSerializer,
)

#: Output field used for the aggregated money columns.
MONEY_FIELD = DecimalField(max_digits=12, decimal_places=2)


def _teacher_month_total(month):
    """Subquery: total revenue entries for one teacher in a given month."""
    return (
        TeacherRevenueEntry.objects.filter(teacher=OuterRef('pk'), month=month)
        .values('teacher')
        .annotate(total=Sum('amount'))
        .values('total')
    )


class StudentViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for students. Requires authentication (global default)."""

    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    search_fields = ('first_name', 'last_name')
    ordering_fields = ('last_name', 'first_name', 'registration_date')

    @action(detail=True, methods=['post'])
    def renew_subscription(self, request, pk=None):
        """Reactivate the student's subscription for another period."""
        student = self.get_object()
        student.renew_subscription()
        accrue_subscription_revenue(student)
        serializer = self.get_serializer(student)
        return Response(serializer.data)


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
        if student.is_subscription_active:
            accrue_subscription_revenue(student)
        group_serializer = GroupSerializer(
            group, context=self.get_serializer_context()
        )
        return Response(group_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update the group, adjusting teachers' revenue for membership changes.

        Newly added subscribed students credit the group's teacher; removed
        students claw back the group's per-student revenue.
        """
        previous_ids = set(
            self.get_object().students.values_list('id', flat=True)
        )
        response = super().update(request, *args, **kwargs)

        group = self.get_object()
        new_ids = set(group.students.values_list('id', flat=True))
        for student in Student.objects.filter(id__in=new_ids - previous_ids):
            if student.is_subscription_active:
                accrue_subscription_revenue(student)
        for student in Student.objects.filter(id__in=previous_ids - new_ids):
            deduct_group_revenue(student, group)
        return response


class teacherRevenues(viewsets.ReadOnlyModelViewSet):
    """List every teacher with their student count and monthly revenue.

    A teacher earns one fixed amount per student they teach each month. The
    current month's total starts at zero and grows as students subscribe or
    renew; `last_month_revenue` is the previous calendar month's total.
    """

    serializer_class = TeacherRevenueSerializer

    def get_queryset(self):
        current_month = timezone.localdate().replace(day=1)
        last_month = add_months(current_month, -1)
        return Teacher.objects.annotate(
            students_count=Count('groups__students', distinct=True),
            current_month_revenue=Coalesce(
                Subquery(_teacher_month_total(current_month)),
                Decimal('0'),
                output_field=MONEY_FIELD,
            ),
            last_month_revenue=Coalesce(
                Subquery(_teacher_month_total(last_month)),
                Decimal('0'),
                output_field=MONEY_FIELD,
            ),
        )

    @action(detail=True, methods=['get'])
    def revenue_entries(self, request, pk=None):
        """Recent revenue movements for one teacher, newest month first.

        Returns the last 60 `TeacherRevenueEntry` rows (one per student per
        month), showing exactly how the teacher's monthly totals were built.
        """
        teacher = self.get_object()
        entries = teacher.revenue_entries.select_related('student')[:60]
        serializer = TeacherRevenueEntrySerializer(entries, many=True)
        return Response(serializer.data)
