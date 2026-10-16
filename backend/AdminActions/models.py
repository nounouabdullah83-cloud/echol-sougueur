import calendar
from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


def add_months(value, months=1):
    """Return `value` shifted forward by `months`, clamping the day if needed."""
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


class Level(models.TextChoices):
    PRIMARY = 'primary', 'ابتدائية'
    MIDDLE = 'middle', 'متوسطة'
    SECONDARY = 'secondary', 'ثانوية'


class Sex(models.TextChoices):
    MALE = 'male', 'ذكر'
    FEMALE = 'female', 'أنثى'


class SchoolClass(models.TextChoices):
    FIRST_YEAR = 'first_year', 'السنة الأولى'
    SECOND_YEAR = 'second_year', 'السنة الثانية'
    THIRD_YEAR = 'third_year', 'السنة الثالثة'
    FOURTH_YEAR = 'fourth_year', 'السنة الرابعة'
    FIFTH_YEAR = 'fifth_year', 'السنة الخامسة'


# Which classes each level accepts. The class label is stage-independent
# (e.g. 'السنة الأولى'), only the number of available years changes:
# ابتدائية years 1-5, متوسطة years 1-4, ثانوية years 1-3.
CLASSES_BY_LEVEL = {
    Level.PRIMARY: (
        SchoolClass.FIRST_YEAR,
        SchoolClass.SECOND_YEAR,
        SchoolClass.THIRD_YEAR,
        SchoolClass.FOURTH_YEAR,
        SchoolClass.FIFTH_YEAR,
    ),
    Level.MIDDLE: (
        SchoolClass.FIRST_YEAR,
        SchoolClass.SECOND_YEAR,
        SchoolClass.THIRD_YEAR,
        SchoolClass.FOURTH_YEAR,
    ),
    Level.SECONDARY: (
        SchoolClass.FIRST_YEAR,
        SchoolClass.SECOND_YEAR,
        SchoolClass.THIRD_YEAR,
    ),
}


class Student(models.Model):
    """A student who belongs to zero or more groups.

    The student's level and class are owned by the Group — a student
    inherits them from the (first) group they belong to.
    """

    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    birthdate = models.DateField()
    birthplace = models.CharField(max_length=255, blank=True)
    sex = models.CharField(max_length=10, choices=Sex.choices, blank=True)
    school = models.CharField(
        max_length=255,
        blank=True,
        help_text='The government school the student attends.',
    )
    father_name = models.CharField(max_length=150, blank=True)
    mother_first_name = models.CharField(max_length=150, blank=True)
    mother_last_name = models.CharField(max_length=150, blank=True)
    responsible_phone1 = models.CharField(max_length=30, blank=True)
    responsible_phone2 = models.CharField(
        max_length=30,
        blank=True,
        help_text='Optional second contact number.',
    )
    address = models.CharField(max_length=255, blank=True)
    registration_date = models.DateField(
        help_text='Set manually by the admin when the student is added.'
    )

    class Meta:
        ordering = ('last_name', 'first_name')
        verbose_name = 'student'
        verbose_name_plural = 'students'

    def __str__(self):
        return self.full_name

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def active_enrollments(self):
        """Enrollments whose stored subscription flag is on (expiry ignored).

        A plain list over `self.enrollments.all()` so `prefetch_related`
        caching is honoured instead of issuing a query per student.
        """
        return [enrollment for enrollment in self.enrollments.all() if enrollment.is_active]

    @property
    def renewal_subscription_date(self):
        """Soonest renewal date across active enrollments, or None."""
        dates = [enrollment.renewal_date for enrollment in self.active_enrollments]
        return min(dates) if dates else None

    @property
    def subscription_expiry_date(self):
        """Expiry of the soonest-renewing active enrollment, or None."""
        renewal = self.renewal_subscription_date
        if renewal is None:
            return None
        return add_months(renewal, Enrollment.SUBSCRIPTION_DURATION_MONTHS)

    @property
    def is_subscription_active(self):
        """True while *any* enrollment has an active, unexpired subscription."""
        return any(
            enrollment.is_subscription_active
            for enrollment in self.active_enrollments
        )


class Teacher(models.Model):
    """A teacher who can be assigned to groups."""

    #: Revenue the school earns from each distinct student this teacher teaches.
    REVENUE_PER_STUDENT = Decimal('1000')

    full_name = models.CharField(max_length=255)

    class Meta:
        ordering = ('full_name',)
        verbose_name = 'teacher'
        verbose_name_plural = 'teachers'

    def __str__(self):
        return self.full_name


class TeacherRevenueKind(models.TextChoices):
    """Whether a revenue entry earns or claws back money."""

    SUBSCRIPTION = 'subscription', 'اشتراك'
    ADJUSTMENT = 'adjustment', 'تعديل'


class TeacherRevenueEntry(models.Model):
    """One movement of revenue for a teacher for a single student in a month.

    A `subscription` entry is recorded when a student's enrollment starts or
    renews its subscription with a teacher. Only one such entry is created per
    enrollment/month, so re-adding or re-renewing the same enrollment in the
    same month never double-counts — while a student enrolled in two of the
    teacher's groups earns the teacher one credit per group. An `adjustment`
    entry (typically negative) reverses part of that revenue, e.g. when the
    student is removed from one of the teacher's groups; by then the enrollment
    row is gone, so it is left untagged. Because entries are keyed by month,
    each new month starts at zero.
    """

    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name='revenue_entries',
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='revenue_entries',
    )
    enrollment = models.ForeignKey(
        'Enrollment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revenue_entries',
        help_text='The enrollment this credit belongs to, when known.',
    )
    month = models.DateField(
        help_text='First day of the month this entry belongs to.',
    )
    kind = models.CharField(
        max_length=20,
        choices=TeacherRevenueKind.choices,
        default=TeacherRevenueKind.SUBSCRIPTION,
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Teacher.REVENUE_PER_STUDENT,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-month',)
        verbose_name = 'teacher revenue entry'
        verbose_name_plural = 'teacher revenue entries'

    def __str__(self):
        return f'{self.teacher} · {self.student} · {self.month:%Y-%m}'


def accrue_enrollment_revenue(enrollment, when=None):
    """Credit the enrollment's group teacher with this month's revenue.

    Revenue accrues **per enrollment**: a student enrolled in two of the same
    teacher's groups earns that teacher two credits. Idempotent per
    enrollment/month, so calling this again in the same month is a no-op.
    Does nothing when the group has no teacher. Returns nothing.
    """
    if enrollment.group.teacher_id is None:
        return
    month = (when or enrollment.renewal_date).replace(day=1)
    already_credited = TeacherRevenueEntry.objects.filter(
        enrollment=enrollment,
        month=month,
        kind=TeacherRevenueKind.SUBSCRIPTION,
    ).exists()
    if already_credited:
        return
    TeacherRevenueEntry.objects.create(
        teacher_id=enrollment.group.teacher_id,
        student=enrollment.student,
        enrollment=enrollment,
        month=month,
        kind=TeacherRevenueKind.SUBSCRIPTION,
        amount=Teacher.REVENUE_PER_STUDENT,
    )


def deduct_group_revenue(student, group, when=None):
    """Claw back a teacher's per-student revenue when a student is removed.

    Called when `student` is removed from `group`. The teacher's fixed
    per-student revenue credit (`Teacher.REVENUE_PER_STUDENT`, i.e. 1000) is
    deducted for the current month, reversing the credit granted when the
    student joined the group. The enrollment row is already gone at this
    point, so the adjustment is left untagged (it still carries the teacher,
    student and month). Does nothing when the group has no teacher. Returns
    nothing.
    """
    if group.teacher_id is None:
        return
    month = (when or timezone.localdate()).replace(day=1)
    TeacherRevenueEntry.objects.create(
        teacher_id=group.teacher_id,
        student=student,
        month=month,
        kind=TeacherRevenueKind.ADJUSTMENT,
        amount=-Teacher.REVENUE_PER_STUDENT,
    )


class Group(models.Model):
    """A class group of students taught by a single teacher.

    The group owns the level and class of its students: every member
    shares the group's level/class.
    """

    group_number = models.PositiveIntegerField(
        unique=True,
        editable=False,
        help_text='Assigned automatically when the group is created.',
    )
    subject = models.CharField(
        max_length=255,
        blank=True,
        help_text='The subject taught to this group.',
    )
    level = models.CharField(
        max_length=20,
        choices=Level.choices,
        blank=True,
    )
    class_name = models.CharField(
        max_length=20,
        choices=SchoolClass.choices,
        blank=True,
        help_text='The school year within the chosen level.',
    )
    students = models.ManyToManyField(
        Student,
        through='Enrollment',
        related_name='groups',
        blank=True,
    )
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='groups',
    )
    revenue_per_student = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text='Revenue collected per student in this group.',
    )

    class Meta:
        ordering = ('group_number',)
        verbose_name = 'group'
        verbose_name_plural = 'groups'

    def __str__(self):
        return f'Group {self.group_number}'

    def save(self, *args, **kwargs):
        # Groups are numbered automatically, one above the current highest.
        if self.group_number is None:
            self.group_number = self.next_group_number()
        super().save(*args, **kwargs)

    @classmethod
    def next_group_number(cls):
        """Return the next free group number (highest existing number + 1)."""
        highest = cls.objects.aggregate(models.Max('group_number'))[
            'group_number__max'
        ]
        return (highest or 0) + 1

    @classmethod
    def classes_for_level(cls, level):
        """Return the allowed `class_name` values for a given level."""
        return CLASSES_BY_LEVEL.get(level, ())

    def clean(self):
        super().clean()
        if self.class_name and self.level:
            allowed = self.classes_for_level(self.level)
            if self.class_name not in allowed:
                raise ValidationError(
                    {'class_name': 'هذا القسم غير متاح للمستوى المختار.'}
                )


class Enrollment(models.Model):
    """One student's membership of one group, with its own subscription.

    The subscription lives *here*, not on the student: each (student, group)
    pair has an independent `renewal_date`, so joining or renewing one group
    never touches the dates of another group the student is in. Membership of
    a group is the existence of this row; `is_active` is the stored
    subscription flag for that membership (the effective state also depends on
    `renewal_date` having not expired).
    """

    #: How long a subscription stays active after its renewal date.
    SUBSCRIPTION_DURATION_MONTHS = 1

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    joined_on = models.DateField(
        default=timezone.localdate,
        help_text='Date the student joined this group.',
    )
    renewal_date = models.DateField(
        default=timezone.localdate,
        help_text=(
            'Start of this enrollment\'s current subscription period. '
            'Defaults to the day the student joined the group.'
        ),
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Stored subscription flag for this enrollment.',
    )

    class Meta:
        ordering = ('joined_on', 'id')
        constraints = [
            models.UniqueConstraint(
                fields=('group', 'student'),
                name='unique_enrollment_per_group_student',
            )
        ]
        verbose_name = 'enrollment'
        verbose_name_plural = 'enrollments'

    def __str__(self):
        return f'{self.student} · Group {self.group_id}'

    @property
    def expiry_date(self):
        """The date this enrollment's subscription expires."""
        return add_months(self.renewal_date, self.SUBSCRIPTION_DURATION_MONTHS)

    @property
    def is_subscription_active(self):
        """Whether this enrollment's subscription is on and not expired."""
        if not self.is_active:
            return False
        return timezone.localdate() <= self.expiry_date

    def renew(self, renewal_date=None):
        """Restart this enrollment's subscription period and credit revenue.

        Only this enrollment is touched — every other group the student
        belongs to keeps its own dates.
        """
        self.renewal_date = renewal_date or timezone.localdate()
        self.is_active = True
        self.save(update_fields=['renewal_date', 'is_active'])
        accrue_enrollment_revenue(self)