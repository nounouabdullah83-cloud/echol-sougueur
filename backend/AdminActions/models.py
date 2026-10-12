from django.core.exceptions import ValidationError
from django.db import models


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


class Teacher(models.Model):
    """A teacher who can be assigned to groups."""

    full_name = models.CharField(max_length=255)

    class Meta:
        ordering = ('full_name',)
        verbose_name = 'teacher'
        verbose_name_plural = 'teachers'

    def __str__(self):
        return self.full_name


class Group(models.Model):
    """A class group of students taught by a single teacher.

    The group owns the level and class of its students: every member
    shares the group's level/class.
    """

    group_number = models.PositiveIntegerField(unique=True)
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