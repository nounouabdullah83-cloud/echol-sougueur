"""Seed the database with fake data for local testing.

Creates an admin user, teachers, students, and groups so the admin UI has
something to show.

Usage:
    python manage.py seed_data
    python manage.py seed_data --reset          # wipe students/teachers/groups first
    python manage.py seed_data --students 40    # change how many students

The command is idempotent: re-running it reuses existing records instead of
creating duplicates.
"""

import random
from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from AdminActions.models import Enrollment, Group, Level, Sex, Student, Teacher

User = get_user_model()

ADMIN_EMAIL = 'admin@example.com'
ADMIN_PASSWORD = 'admin12345'

TEACHERS = [
    'أ. محمد بوعلام',
    'أ. فاطمة الزهراء بن علي',
    'أ. كريم حمدان',
    'أ. سعاد مزيان',
    'أ. ياسين بلقاسم',
]

MALE_NAMES = [
    'محمد', 'أحمد', 'عبد الرحمن', 'يوسف', 'إلياس', 'رياض', 'أمين',
    'بلال', 'أسامة', 'وليد', 'إسلام', 'خالد', 'أيوب', 'زكرياء', 'عبد الله',
]

FEMALE_NAMES = [
    'سارة', 'مريم', 'لينا', 'نور', 'ياسمين', 'هدى', 'أمال',
    'إيمان', 'شيماء', 'رانيا', 'جنى', 'ملك', 'ريتاج', 'سلمى', 'هبة',
]

FAMILY_NAMES = [
    'بن علي', 'بوزيد', 'حمدان', 'مزيان', 'بلقاسم', 'عماري', 'شريف',
    'بوعلام', 'زروقي', 'قاسمي', 'بوضياف', 'لعروسي', 'بن ناصر',
    'سعداوي', 'مرابط',
]

BIRTHPLACES = [
    'الجزائر', 'وهران', 'قسنطينة', 'سطيف', 'عنابة',
    'تلمسان', 'باتنة', 'بسكرة', 'البليدة', 'تيزي وزو',
]

SCHOOLS = [
    'مدرسة ابن باديس',
    'مدرسة الأمير عبد القادر',
    'مدرسة الشهيد حماني',
    'مدرسة العقيد لطفي',
    'مدرسة محمد البشير الإبراهيمي',
]

SUBJECTS = [
    'الرياضيات',
    'اللغة العربية',
    'اللغة الفرنسية',
    'اللغة الإنجليزية',
    'العلوم الفيزيائية',
    'علوم الطبيعة والحياة',
    'التاريخ والجغرافيا',
    'التربية الإسلامية',
]

ADDRESSES = [
    'حي النصر، الجزائر',
    'حي 200 مسكن، سطيف',
    'شارع الاستقلال، وهران',
    'حي بن ساسي، قسنطينة',
    'حي عيسى عبد المؤمن، سطيف',
    'حي بوعروة، الجزائر',
]


class Command(BaseCommand):
    help = 'Create sample teachers, students, and groups for testing.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing teachers, students, and groups first.',
        )
        parser.add_argument(
            '--students',
            type=int,
            default=24,
            help='How many students to create (default: 24).',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(42)

        if options['reset']:
            Group.objects.all().delete()
            Student.objects.all().delete()
            Teacher.objects.all().delete()
            self.stdout.write(self.style.WARNING('Existing data cleared.'))

        admin = self._create_admin()
        teachers = self._create_teachers()
        students = self._create_students(options['students'])
        self._create_groups(teachers, students)

        self.stdout.write(self.style.SUCCESS('Seed complete.'))
        self.stdout.write(f'  admin:    {admin.email} / {ADMIN_PASSWORD}')
        self.stdout.write(f'  teachers: {Teacher.objects.count()}')
        self.stdout.write(f'  students: {Student.objects.count()}')
        self.stdout.write(f'  groups:   {Group.objects.count()}')

    def _create_admin(self):
        user, created = User.objects.get_or_create(
            email=ADMIN_EMAIL,
            defaults={'first_name': 'Admin', 'last_name': 'Echole'},
        )
        if created:
            user.set_password(ADMIN_PASSWORD)
            user.is_staff = True
            user.is_superuser = True
            user.save()
        return user

    def _create_teachers(self):
        teachers = []
        for name in TEACHERS:
            teacher, _ = Teacher.objects.get_or_create(full_name=name)
            teachers.append(teacher)
        return teachers

    def _create_students(self, count):
        students = []
        for _ in range(count):
            sex = random.choice([Sex.MALE, Sex.FEMALE])
            first_name = random.choice(
                MALE_NAMES if sex == Sex.MALE else FEMALE_NAMES
            )
            last_name = random.choice(FAMILY_NAMES)
            birthdate = date(
                random.randint(2008, 2018),
                random.randint(1, 12),
                random.randint(1, 28),
            )

            student, _ = Student.objects.get_or_create(
                first_name=first_name,
                last_name=last_name,
                birthdate=birthdate,
                defaults={
                    'birthplace': random.choice(BIRTHPLACES),
                    'sex': sex,
                    'school': random.choice(SCHOOLS),
                    'father_name': random.choice(MALE_NAMES),
                    'mother_first_name': random.choice(FEMALE_NAMES),
                    'mother_last_name': random.choice(FAMILY_NAMES),
                    'responsible_phone1': f'05{random.randint(10000000, 99999999)}',
                    'responsible_phone2': (
                        f'06{random.randint(10000000, 99999999)}'
                        if random.random() < 0.5
                        else ''
                    ),
                    'address': random.choice(ADDRESSES),
                    'registration_date': date(2026, 9, random.randint(1, 15)),
                },
            )
            students.append(student)
        return students

    def _create_groups(self, teachers, students):
        for number in range(1, 6):
            level = random.choice(Level.values)
            members = random.sample(students, k=min(len(students), random.randint(4, 8)))
            group, _ = Group.objects.get_or_create(
                group_number=number,
                defaults={
                    'subject': random.choice(SUBJECTS),
                    'level': level,
                    'teacher': random.choice(teachers) if teachers else None,
                    'revenue_per_student': random.choice([1500, 2000, 2500, 3000]),
                },
            )
            group.level = level
            group.class_name = random.choice(Group.classes_for_level(level))
            group.save(update_fields=['level', 'class_name'])
            self._set_members(group, members)

    def _set_members(self, group, members):
        """Sync a group's memberships, keeping seeded subscriptions realistic.

        Enrollment dates default to *today*, which would mark every seeded
        student as subscribed; seeding instead starts each subscription on the
        student's registration date (September), so the demo data contains a
        healthy mix of active and expired subscriptions — matching the old
        behaviour where subscription dates defaulted to registration.
        """
        group.enrollments.exclude(student__in=members).delete()
        for student in members:
            Enrollment.objects.get_or_create(
                group=group,
                student=student,
                defaults={
                    'joined_on': student.registration_date,
                    'renewal_date': student.registration_date,
                },
            )
