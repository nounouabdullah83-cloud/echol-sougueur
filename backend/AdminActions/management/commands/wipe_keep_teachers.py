"""Remove every student, group, and revenue entry — keep only teachers.

Usage:
    python manage.py wipe_keep_teachers

Useful after `seed_data` (or real testing) when you want a clean slate but
don't want to re-create the teacher list. Deleting the students cascades
their revenue entries and group memberships; the admin login is untouched.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from AdminActions.models import Group, Student, Teacher, TeacherRevenueEntry


class Command(BaseCommand):
    help = 'Delete all students, groups, and revenue entries, keeping teachers.'

    @transaction.atomic
    def handle(self, *args, **options):
        groups = Group.objects.count()
        students = Student.objects.count()
        entries = TeacherRevenueEntry.objects.count()
        teachers = Teacher.objects.count()

        Group.objects.all().delete()
        Student.objects.all().delete()
        TeacherRevenueEntry.objects.all().delete()

        self.stdout.write(self.style.WARNING('Data cleared (teachers kept).'))
        self.stdout.write(f'  deleted         -> groups: {groups}')
        self.stdout.write(f'                    students: {students}')
        self.stdout.write(f'                    revenue entries: {entries}')
        self.stdout.write(f'  teachers kept   -> {Teacher.objects.count()}')
        self.stdout.write(f'  (was {teachers})')
