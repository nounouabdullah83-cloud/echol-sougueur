from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    Group,
    Level,
    SchoolClass,
    Sex,
    Student,
    Teacher,
    TeacherRevenueEntry,
    add_months,
)

User = get_user_model()


class AdminActionsAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email='admin@example.com', password='S3cure-Passw0rd!'
        )
        login = self.client.post(
            reverse('AdminAuth:login'),
            {'email': 'admin@example.com', 'password': 'S3cure-Passw0rd!'},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def test_endpoints_require_authentication(self):
        self.client.credentials()
        for name in (
            'student-list',
            'teacher-list',
            'group-list',
            'teacher-revenue-list',
        ):
            response = self.client.get(reverse(f'AdminActions:{name}'))
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_student(self):
        response = self.client.post(
            reverse('AdminActions:student-list'),
            {
                'first_name': 'Ada',
                'last_name': 'Lovelace',
                'birthdate': '2008-12-10',
                'birthplace': 'Algiers',
                'sex': Sex.FEMALE,
                'school': 'Government School A',
                'father_name': 'Gordon Lovelace',
                'mother_first_name': 'Jane',
                'mother_last_name': 'Byron',
                'responsible_phone1': '0550000000',
                'responsible_phone2': '0660000000',
                'address': '12 Example Street',
                'registration_date': '2026-09-01',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        student = Student.objects.get(id=response.data['id'])
        self.assertEqual(student.full_name, 'Ada Lovelace')
        self.assertEqual(student.birthplace, 'Algiers')
        self.assertEqual(student.school, 'Government School A')
        self.assertEqual(student.father_name, 'Gordon Lovelace')
        self.assertEqual(student.mother_first_name, 'Jane')
        self.assertEqual(student.mother_last_name, 'Byron')
        self.assertEqual(student.responsible_phone1, '0550000000')
        self.assertEqual(student.responsible_phone2, '0660000000')
        self.assertEqual(student.address, '12 Example Street')
        self.assertEqual(response.data['sex_display'], 'أنثى')
        # Outside a group a student has no level/class.
        self.assertIsNone(response.data['level_display'])
        self.assertEqual(response.data['class_name_display'], '')

    def test_student_level_derives_from_group(self):
        group = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FOURTH_YEAR,
        )
        student = Student.objects.create(
            first_name='Ada',
            last_name='Lovelace',
            birthdate='2008-12-10',
            registration_date='2026-09-01',
        )
        group.students.add(student)

        response = self.client.get(
            reverse('AdminActions:student-detail', args=[student.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['level'], Level.PRIMARY)
        self.assertEqual(response.data['level_display'], 'ابتدائية')
        self.assertEqual(response.data['class_name'], SchoolClass.FOURTH_YEAR)
        self.assertEqual(response.data['class_name_display'], 'السنة الرابعة')

        group.students.remove(student)
        updated = self.client.get(
            reverse('AdminActions:student-detail', args=[student.id])
        )
        self.assertIsNone(updated.data['level_display'])

    def test_create_teacher(self):
        response = self.client.post(
            reverse('AdminActions:teacher-list'),
            {'full_name': 'Alan Turing'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        teacher = Teacher.objects.get(id=response.data['id'])
        self.assertEqual(teacher.full_name, 'Alan Turing')

    def test_delete_teacher(self):
        teacher = Teacher.objects.create(full_name='Alan Turing')
        group = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FIRST_YEAR,
            teacher=teacher,
        )

        response = self.client.delete(
            reverse('AdminActions:teacher-detail', args=[teacher.id])
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Teacher.objects.filter(id=teacher.id).exists())
        # The teacher's groups survive, simply losing their teacher.
        group.refresh_from_db()
        self.assertIsNone(group.teacher)

    def test_create_group(self):
        teacher = Teacher.objects.create(full_name='Alan Turing')
        response = self.client.post(
            reverse('AdminActions:group-list'),
            {
                'subject': 'Mathematics',
                'level': Level.MIDDLE,
                'class_name': SchoolClass.THIRD_YEAR,
                'teacher': teacher.id,
                'students': [],
                'revenue_per_student': '1500.00',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        group = Group.objects.get(id=response.data['id'])
        # The number is assigned automatically.
        self.assertEqual(group.group_number, 1)
        self.assertEqual(response.data['group_number'], 1)
        self.assertEqual(group.subject, 'Mathematics')
        self.assertEqual(group.level, Level.MIDDLE)
        self.assertEqual(group.class_name, SchoolClass.THIRD_YEAR)
        self.assertEqual(response.data['level_display'], 'متوسطة')
        self.assertEqual(response.data['class_name_display'], 'السنة الثالثة')
        self.assertEqual(group.teacher, teacher)
        self.assertEqual(group.revenue_per_student, 1500)
        self.assertEqual(response.data['teacher_name'], 'Alan Turing')

    def test_group_numbers_auto_increment(self):
        first = Group.objects.create(subject='Mathematics')
        second = Group.objects.create(subject='Science')
        self.assertEqual(first.group_number, 1)
        self.assertEqual(second.group_number, 2)

    def test_group_rejects_class_outside_level(self):
        response = self.client.post(
            reverse('AdminActions:group-list'),
            {
                'subject': 'Mathematics',
                'level': Level.SECONDARY,
                # ثانوية only has years 1-3, so a 4th year must be rejected.
                'class_name': SchoolClass.FOURTH_YEAR,
                'students': [],
                'revenue_per_student': '1500.00',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('class_name', response.data)

    def test_add_student_to_group(self):
        group = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FOURTH_YEAR,
        )
        response = self.client.post(
            reverse('AdminActions:group-add-student', args=[group.id]),
            {
                'first_name': 'Ada',
                'last_name': 'Lovelace',
                'birthdate': '2008-12-10',
                'registration_date': '2026-09-01',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        group.refresh_from_db()
        self.assertEqual(group.students.count(), 1)
        student = group.students.first()
        self.assertEqual(student.full_name, 'Ada Lovelace')
        # The student's level/class serializes from this group (M2M).
        member = response.data['students_detail'][0]
        self.assertEqual(member['level_display'], 'ابتدائية')
        self.assertEqual(member['class_name_display'], 'السنة الرابعة')

    def test_teacher_revenues(self):
        teacher = Teacher.objects.create(full_name='Alan Turing')
        Teacher.objects.create(full_name='Grace Hopper')
        today = timezone.localdate()
        ada = Student.objects.create(
            first_name='Ada',
            last_name='Lovelace',
            birthdate='2008-12-10',
            registration_date=today,
        )
        alan = Student.objects.create(
            first_name='Alan',
            last_name='Key',
            birthdate='2008-12-10',
            registration_date=today,
        )
        math = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FIRST_YEAR,
            teacher=teacher,
        )
        math.students.set([ada, alan])
        science = Group.objects.create(
            group_number=2,
            subject='Science',
            level=Level.PRIMARY,
            class_name=SchoolClass.SECOND_YEAR,
            teacher=teacher,
        )
        # Ada is shared with the teacher's other group, so she counts once.
        science.students.set([ada])

        # Renewing a student credits each of their teachers once this month.
        for student in (ada, alan):
            renew = self.client.post(
                reverse('AdminActions:student-renew-subscription', args=[student.id])
            )
            self.assertEqual(renew.status_code, status.HTTP_200_OK)

        # A stale entry from the previous month shows as last month's revenue.
        TeacherRevenueEntry.objects.create(
            teacher=teacher,
            student=alan,
            month=add_months(today.replace(day=1), -1),
            amount=Decimal('1000'),
        )

        response = self.client.get(reverse('AdminActions:teacher-revenue-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        by_name = {row['full_name']: row for row in response.data}
        turing = by_name['Alan Turing']
        self.assertEqual(turing['students_count'], 2)
        self.assertEqual(Decimal(turing['current_month_revenue']), Decimal('2000.00'))
        self.assertEqual(Decimal(turing['last_month_revenue']), Decimal('1000.00'))
        # A teacher with no students has no revenue.
        hopper = by_name['Grace Hopper']
        self.assertEqual(hopper['students_count'], 0)
        self.assertEqual(Decimal(hopper['current_month_revenue']), Decimal('0.00'))
        self.assertEqual(Decimal(hopper['last_month_revenue']), Decimal('0.00'))

    def test_teacher_revenue_entries_endpoint(self):
        teacher = Teacher.objects.create(full_name='Alan Turing')
        student = Student.objects.create(
            first_name='Ada',
            last_name='Lovelace',
            birthdate='2008-12-10',
            registration_date=timezone.localdate(),
        )
        group = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FIRST_YEAR,
            teacher=teacher,
        )
        group.students.add(student)

        # Renewing credits a subscription entry the teacher can see in history.
        self.client.post(
            reverse('AdminActions:student-renew-subscription', args=[student.id])
        )

        response = self.client.get(
            reverse('AdminActions:teacher-revenue-revenue-entries', args=[teacher.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        entry = response.data[0]
        self.assertEqual(entry['student_name'], 'Ada Lovelace')
        self.assertEqual(entry['kind'], 'subscription')
        self.assertEqual(entry['kind_display'], 'اشتراك')
        self.assertEqual(Decimal(entry['amount']), Decimal('1000.00'))

        # The single-teacher summary (teacher card page) exposes the same totals.
        detail = self.client.get(
            reverse('AdminActions:teacher-revenue-detail', args=[teacher.id])
        )
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.data['full_name'], 'Alan Turing')
        self.assertEqual(detail.data['students_count'], 1)
        self.assertEqual(
            Decimal(detail.data['current_month_revenue']), Decimal('1000.00')
        )

    def test_renewing_within_same_month_does_not_double_charge(self):
        teacher = Teacher.objects.create(full_name='Alan Turing')
        student = Student.objects.create(
            first_name='Ada',
            last_name='Lovelace',
            birthdate='2008-12-10',
            registration_date=timezone.localdate(),
        )
        group = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FIRST_YEAR,
            teacher=teacher,
        )
        group.students.add(student)

        url = reverse('AdminActions:student-renew-subscription', args=[student.id])
        self.client.post(url)
        self.client.post(url)

        self.assertEqual(
            TeacherRevenueEntry.objects.filter(teacher=teacher).count(), 1
        )

    def test_removing_student_deducts_group_revenue(self):
        teacher = Teacher.objects.create(full_name='Alan Turing')
        student = Student.objects.create(
            first_name='Ada',
            last_name='Lovelace',
            birthdate='2008-12-10',
            registration_date=timezone.localdate(),
        )
        group = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FIRST_YEAR,
            teacher=teacher,
            revenue_per_student=Decimal('1500'),
        )
        group.students.add(student)

        # Subscribing credits the teacher 1000 for this month.
        self.client.post(
            reverse('AdminActions:student-renew-subscription', args=[student.id])
        )

        # Removing the student claws back the fixed 1000 credit, not the
        # group's per-student revenue.
        response = self.client.patch(
            reverse('AdminActions:group-detail', args=[group.id]),
            {'students': []},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        adjustment = TeacherRevenueEntry.objects.get(
            teacher=teacher, student=student, kind='adjustment'
        )
        self.assertEqual(adjustment.amount, Decimal('-1000.00'))

        revenues = self.client.get(reverse('AdminActions:teacher-revenue-list'))
        row = {r['full_name']: r for r in revenues.data}['Alan Turing']
        # 1000 credited on renewal minus the 1000 clawed back.
        self.assertEqual(Decimal(row['current_month_revenue']), Decimal('0.00'))

    def test_removing_student_without_a_credit_still_deducts(self):
        teacher = Teacher.objects.create(full_name='Alan Turing')
        student = Student.objects.create(
            first_name='Ada',
            last_name='Lovelace',
            birthdate='2008-12-10',
            registration_date=timezone.localdate(),
        )
        group = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FIRST_YEAR,
            teacher=teacher,
            revenue_per_student=Decimal('0'),
        )
        group.students.add(student)

        self.client.patch(
            reverse('AdminActions:group-detail', args=[group.id]),
            {'students': []},
            format='json',
        )

        # The fixed 1000 is always deducted, independent of the group's rate.
        adjustment = TeacherRevenueEntry.objects.get(
            teacher=teacher, student=student, kind='adjustment'
        )
        self.assertEqual(adjustment.amount, Decimal('-1000.00'))