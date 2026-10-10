from django.db import models


class Student(models.Model):
    """A student who belongs to zero or more groups."""

    class Level(models.TextChoices):
        FIRST_MIDDLE = 'first_middle', 'أولى متوسط'
        SECOND_MIDDLE = 'second_middle', 'ثانية متوسط'
        THIRD_MIDDLE = 'third_middle', 'ثالثة متوسط'
        FOURTH_MIDDLE = 'fourth_middle', 'رابعة متوسط'
        FIRST_SECONDARY = 'first_secondary', 'أولى ثانوي'
        SECOND_SECONDARY = 'second_secondary', 'ثانية ثانوي'
        THIRD_SECONDARY = 'third_secondary', 'ثالثة ثانوي'

    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    birthdate = models.DateField()
    registration_date = models.DateField(
        help_text='Set manually by the admin when the student is added.'
    )
    level = models.CharField(max_length=20, choices=Level.choices)

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
    """A teacher who can be assigned to groups and subjects."""

    full_name = models.CharField(max_length=255)

    class Meta:
        ordering = ('full_name',)
        verbose_name = 'teacher'
        verbose_name_plural = 'teachers'

    def __str__(self):
        return self.full_name


class Group(models.Model):
    """A class group of students taught by a single teacher."""

    group_number = models.PositiveIntegerField(unique=True)
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


class Subject(models.Model):
    """A subject taught by teachers to groups."""

    name = models.CharField(max_length=255, unique=True)
    teachers = models.ManyToManyField(Teacher, related_name='subjects', blank=True)
    groups = models.ManyToManyField(Group, related_name='subjects', blank=True)

    class Meta:
        ordering = ('name',)
        verbose_name = 'subject'
        verbose_name_plural = 'subjects'

    def __str__(self):
        return self.name
