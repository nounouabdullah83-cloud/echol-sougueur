from decimal import Decimal

from django.db.models import Count, DecimalField, OuterRef, Subquery, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Enrollment,
    Group,
    Student,
    Teacher,
    TeacherRevenueEntry,
    accrue_enrollment_revenue,
    add_months,
    deduct_group_revenue,
)
from .serializers import (
    EnrollmentSerializer,
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

    queryset = Student.objects.prefetch_related('enrollments').all()
    serializer_class = StudentSerializer
    search_fields = ('first_name', 'last_name')
    ordering_fields = ('last_name', 'first_name', 'registration_date')


class EnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    """Read a student's per-group enrollments and renew them individually.

    Renewal applies per (student, group): reactivating one enrollment never
    touches the dates — or revenue — of another group the student is in.
    """

    queryset = Enrollment.objects.select_related('group', 'student').all()
    serializer_class = EnrollmentSerializer
    search_fields = ('student__first_name', 'student__last_name', 'group__group_number')
    ordering_fields = ('joined_on', 'renewal_date')

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """Restart this enrollment's subscription for another period.

        Accepts an optional `renewal_date` (ISO date) to backdate or schedule
        the renewal; defaults to today. Credits this enrollment's group
        teacher (once per enrollment per month).
        """
        enrollment = self.get_object()
        renewal_date = None
        raw_date = request.data.get('renewal_date')
        if raw_date:
            renewal_date = serializers.DateField().run_validation(raw_date)
        enrollment.renew(renewal_date)
        return Response(self.get_serializer(enrollment).data)


class TeacherViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for teachers. Requires authentication (global default)."""

    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    search_fields = ('full_name',)
    ordering_fields = ('full_name',)


class GroupViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for groups. Requires authentication (global default)."""

    queryset = (
        Group.objects.prefetch_related('students__enrollments', 'enrollments')
        .select_related('teacher')
        .all()
    )
    serializer_class = GroupSerializer
    search_fields = ('group_number', 'subject')
    ordering_fields = ('group_number',)

    @action(detail=True, methods=['post'])
    def add_student(self, request, pk=None):
        """Create a student and enroll them in this group.

        The enrollment starts its own subscription today (the moment it is
        paid for/joined); other groups the student may already belong to keep
        their own dates untouched.
        """
        group = self.get_object()
        serializer = StudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        enrollment = Enrollment.objects.create(
            group=group,
            student=student,
            joined_on=timezone.localdate(),
            renewal_date=timezone.localdate(),
            is_active=True,
        )
        if enrollment.is_subscription_active:
            accrue_enrollment_revenue(enrollment)
        # Re-fetch so the response reflects the new member (the prefetch cache
        # above was populated before the enrollment existed).
        group = self.get_object()
        group_serializer = GroupSerializer(
            group, context=self.get_serializer_context()
        )
        return Response(group_serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        """Credit the group's teacher for students enrolled when it is created."""
        group = serializer.save()
        for enrollment in group.enrollments.all():
            if enrollment.is_subscription_active:
                accrue_enrollment_revenue(enrollment)

    def update(self, request, *args, **kwargs):
        """Update the group, adjusting teachers' revenue for membership changes.

        Newly enrolled students credit this group's teacher (revenue accrues
        per enrollment, so a student shared between two of the teacher's
        groups earns two credits); removed students claw back the group's
        per-student revenue for the month.
        """
        previous_ids = set(
            self.get_object().students.values_list('id', flat=True)
        )
        super().update(request, *args, **kwargs)

        group = self.get_object()
        new_ids = set(group.students.values_list('id', flat=True))
        for enrollment in group.enrollments.filter(
            student_id__in=new_ids - previous_ids
        ):
            if enrollment.is_subscription_active:
                accrue_enrollment_revenue(enrollment)
        for student in Student.objects.filter(id__in=previous_ids - new_ids):
            deduct_group_revenue(student, group)
        # Re-serialize from a freshly fetched group so `students_detail` and
        # `enrollments` aren't stale snapshots of the pre-update memberships.
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)


class teacherRevenues(viewsets.ReadOnlyModelViewSet):
    """List every teacher with their student count and monthly revenue.

    A teacher earns one fixed amount per enrolled group each month: a student
    in two of the teacher's groups counts once in `students_count` but earns
    two credits. The current month's total starts at zero and grows as
    enrollments start or renew; `last_month_revenue` is the previous calendar
    month's total.
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

        Returns the last 60 `TeacherRevenueEntry` rows (one per enrollment
        per month), showing exactly how the teacher's monthly totals were
        built.
        """
        teacher = self.get_object()
        entries = teacher.revenue_entries.select_related(
            'student', 'enrollment__group'
        )[:60]
        serializer = TeacherRevenueEntrySerializer(entries, many=True)
        return Response(serializer.data)
