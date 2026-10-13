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
    is_subscribed = models.BooleanField(
        default=True,
        help_text='True while the student has an active subscription.',
    )
    renewal_subscription_date = models.DateField(
        null=True,
        blank=True,
        help_text=(
            'Date the subscription was last renewed. Defaults to the '
            'registration date when the student is first added.'
        ),
    )

    #: How long a subscription stays active after its renewal date.
    SUBSCRIPTION_DURATION_MONTHS = 1

    class Meta:
        ordering = ('last_name', 'first_name')
        verbose_name = 'student'
        verbose_name_plural = 'students'

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        # The subscription starts on the registration date by default.
        if not self.renewal_subscription_date:
            self.renewal_subscription_date = self.registration_date
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def subscription_expiry_date(self):
        """The date the current subscription expires, or None if unknown."""
        if not self.renewal_subscription_date:
            return None
        return add_months(
            self.renewal_subscription_date, self.SUBSCRIPTION_DURATION_MONTHS
        )

    @property
    def is_subscription_active(self):
        """Whether the subscription is currently active (not expired)."""
        expiry = self.subscription_expiry_date
        if not self.is_subscribed or expiry is None:
            return False
        return timezone.localdate() <= expiry

    def renew_subscription(self, renewal_date=None):
        """Reactivate the subscription and reset its renewal date."""
        self.is_subscribed = True
        self.renewal_subscription_date = renewal_date or timezone.localdate()
        self.save(update_fields=['is_subscribed', 'renewal_subscription_date'])


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

    A `subscription` entry is recorded when a subscribed student starts a
    subscription with, or renews it for, a teacher. Only one such entry is
    created per teacher/student/month, so re-adding or re-renewing the same
    student in the same month never double-counts. An `adjustment` entry
    (typically negative) reverses part of that revenue, e.g. when the student
    is removed from one of the teacher's groups. Because entries are keyed by
    month, each new month starts at zero.
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


def accrue_subscription_revenue(student, when=None):
    """Credit every teacher of `student` with this month's revenue.

    A teacher is credited at most once per student per month, so calling this
    again in the same month is a no-op. Returns nothing.
    """
    month = (when or timezone.localdate()).replace(day=1)
    teacher_ids = set(
        Teacher.objects.filter(groups__students=student)
        .values_list('id', flat=True)
        .distinct()
    )
    already_credited = set(
        TeacherRevenueEntry.objects.filter(
            student=student,
            month=month,
            kind=TeacherRevenueKind.SUBSCRIPTION,
            teacher_id__in=teacher_ids,
        ).values_list('teacher_id', flat=True)
    )
    TeacherRevenueEntry.objects.bulk_create(
        [
            TeacherRevenueEntry(
                teacher_id=teacher_id,
                student=student,
                month=month,
                kind=TeacherRevenueKind.SUBSCRIPTION,
                amount=Teacher.REVENUE_PER_STUDENT,
            )
            for teacher_id in teacher_ids - already_credited
        ]
    )


def deduct_group_revenue(student, group, when=None):
    """Claw back a teacher's per-student revenue when a student is removed.

    Called when `student` is removed from `group`. The teacher's fixed
    per-student revenue credit (`Teacher.REVENUE_PER_STUDENT`, i.e. 1000) is
    deducted for the current month, reversing the credit granted when the
    student subscribed. Does nothing when the group has no teacher. Returns
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
    students = models.ManyToManyField(Student, related_name='groups', blank=True)
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