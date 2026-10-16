from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    Enrollment,
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
            'enrollment-list',
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

    def test_delete_student(self):
        teacher = Teacher.objects.create(full_name='Alan Turing')
        group = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FIRST_YEAR,
            teacher=teacher,
        )
        student = Student.objects.create(
            first_name='Ada',
            last_name='Lovelace',
            birthdate='2008-12-10',
            registration_date='2026-09-01',
        )
        group.students.add(student)
        TeacherRevenueEntry.objects.create(
            teacher=teacher,
            student=student,
            month=timezone.localdate().replace(day=1),
        )

        response = self.client.delete(
            reverse('AdminActions:student-detail', args=[student.id])
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Student.objects.filter(id=student.id).exists())
        # The group survives, simply losing the member.
        group.refresh_from_db()
        self.assertEqual(list(group.students.all()), [])
        # The student's revenue history cascades away with them.
        self.assertFalse(
            TeacherRevenueEntry.objects.filter(student_id=student.id).exists()
        )

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
        # Joining the group creates an enrollment with its own subscription
        # starting today, independent of any other group.
        enrollment = group.enrollments.get(student=student)
        self.assertEqual(enrollment.joined_on, timezone.localdate())
        self.assertEqual(enrollment.renewal_date, timezone.localdate())
        self.assertTrue(enrollment.is_subscription_active)
        # The student's level/class serializes from this group (M2M).
        member = response.data['students_detail'][0]
        self.assertEqual(member['level_display'], 'ابتدائية')
        self.assertEqual(member['class_name_display'], 'السنة الرابعة')
        self.assertEqual(member['enrollments'][0]['renewal_date'], str(timezone.localdate()))

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

        # Renewing each enrollment credits its group's teacher — once per
        # enrollment per month, so Ada (in two groups) earns two credits.
        for enrollment in Enrollment.objects.filter(student__in=(ada, alan)):
            renew = self.client.post(
                reverse('AdminActions:enrollment-renew', args=[enrollment.id])
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
        # Students are counted distinctly…
        self.assertEqual(turing['students_count'], 2)
        # …but revenue accrues per group: Ada in 2 groups + Alan in 1 = 3000.
        self.assertEqual(Decimal(turing['current_month_revenue']), Decimal('3000.00'))
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

        # Renewing the enrollment credits a subscription entry (tagged with
        # its group) the teacher can see in history.
        enrollment = group.enrollments.get(student=student)
        renew = self.client.post(
            reverse('AdminActions:enrollment-renew', args=[enrollment.id])
        )
        self.assertEqual(renew.status_code, status.HTTP_200_OK)

        response = self.client.get(
            reverse('AdminActions:teacher-revenue-revenue-entries', args=[teacher.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        entry = response.data[0]
        self.assertEqual(entry['student_name'], 'Ada Lovelace')
        self.assertEqual(entry['kind'], 'subscription')
        self.assertEqual(entry['kind_display'], 'اشتراك')
        self.assertEqual(entry['group_number'], group.group_number)
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

        enrollment = group.enrollments.get(student=student)
        url = reverse('AdminActions:enrollment-renew', args=[enrollment.id])
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
        enrollment = group.enrollments.get(student=student)
        renew = self.client.post(
            reverse('AdminActions:enrollment-renew', args=[enrollment.id])
        )
        self.assertEqual(renew.status_code, status.HTTP_200_OK)

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

    def test_enrollment_dates_are_independent_across_groups(self):
        """Renewing one group's subscription never touches another group's dates."""
        teacher = Teacher.objects.create(full_name='Alan Turing')
        student = Student.objects.create(
            first_name='Ada',
            last_name='Lovelace',
            birthdate='2008-12-10',
            registration_date=timezone.localdate(),
        )
        math = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FIRST_YEAR,
            teacher=teacher,
        )
        science = Group.objects.create(
            group_number=2,
            subject='Science',
            level=Level.PRIMARY,
            class_name=SchoolClass.SECOND_YEAR,
            teacher=teacher,
        )
        math.students.add(student)
        science.students.add(student)

        math_enrollment = math.enrollments.get(student=student)
        science_enrollment = science.enrollments.get(student=student)
        # Give the science enrollment an older, expired subscription.
        expired = add_months(timezone.localdate(), -2)
        science_enrollment.renewal_date = expired
        science_enrollment.save(update_fields=['renewal_date'])

        renew = self.client.post(
            reverse('AdminActions:enrollment-renew', args=[math_enrollment.id])
        )
        self.assertEqual(renew.status_code, status.HTTP_200_OK)

        math_enrollment.refresh_from_db()
        science_enrollment.refresh_from_db()
        self.assertEqual(math_enrollment.renewal_date, timezone.localdate())
        self.assertTrue(math_enrollment.is_subscription_active)
        # The other group's subscription is untouched: still expired.
        self.assertEqual(science_enrollment.renewal_date, expired)
        self.assertFalse(science_enrollment.is_subscription_active)

        # The student stays subscribed (math is active), while the derived
        # summary dates surface the soonest renewal — the lapsed science group.
        student.refresh_from_db()
        self.assertTrue(student.is_subscription_active)
        self.assertEqual(student.renewal_subscription_date, expired)
        self.assertEqual(student.subscription_expiry_date, add_months(expired, 1))

    def test_adding_to_second_group_keeps_first_groups_dates(self):
        """An enrollment created by the API starts its own subscription."""
        teacher = Teacher.objects.create(full_name='Alan Turing')
        student = Student.objects.create(
            first_name='Ada',
            last_name='Lovelace',
            birthdate='2008-12-10',
            registration_date=timezone.localdate(),
        )
        math = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FIRST_YEAR,
            teacher=teacher,
        )
        science = Group.objects.create(
            group_number=2,
            subject='Science',
            level=Level.PRIMARY,
            class_name=SchoolClass.SECOND_YEAR,
            teacher=teacher,
        )
        math.students.add(student)
        old_renewal = add_months(timezone.localdate(), -1)
        math_enrollment = math.enrollments.get(student=student)
        math_enrollment.renewal_date = old_renewal
        math_enrollment.save(update_fields=['renewal_date'])

        # Join the second group through the API.
        response = self.client.patch(
            reverse('AdminActions:group-detail', args=[science.id]),
            {'students': [student.id]},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        math_enrollment.refresh_from_db()
        self.assertEqual(math_enrollment.renewal_date, old_renewal)
        science_enrollment = science.enrollments.get(student=student)
        self.assertEqual(science_enrollment.renewal_date, timezone.localdate())
        self.assertTrue(science_enrollment.is_subscription_active)

    def test_student_subscription_is_derived_from_enrollments(self):
        """Student-level `is_subscribed` is 'any active enrollment', not a flag."""
        student = Student.objects.create(
            first_name='Ada',
            last_name='Lovelace',
            birthdate='2008-12-10',
            registration_date=timezone.localdate(),
        )
        # Outside any group there is nothing to subscribe *to*.
        self.assertFalse(student.is_subscription_active)
        response = self.client.get(
            reverse('AdminActions:student-detail', args=[student.id])
        )
        self.assertFalse(response.data['is_subscribed'])

        group = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FIRST_YEAR,
        )
        group.students.add(student)
        response = self.client.get(
            reverse('AdminActions:student-detail', args=[student.id])
        )
        self.assertTrue(response.data['is_subscribed'])
        self.assertEqual(len(response.data['enrollments']), 1)

        # Deactivating the enrollment unsubscribes the student.
        enrollment = group.enrollments.get(student=student)
        enrollment.is_active = False
        enrollment.save(update_fields=['is_active'])
        response = self.client.get(
            reverse('AdminActions:student-detail', args=[student.id])
        )
        self.assertFalse(response.data['is_subscribed'])
        self.assertIsNone(response.data['renewal_subscription_date'])
        self.assertIsNone(response.data['subscription_expiry_date'])

    def test_teacher_earns_one_credit_per_group(self):
        """A student in two groups of one teacher earns that teacher 2x1000."""
        teacher = Teacher.objects.create(full_name='Alan Turing')
        student = Student.objects.create(
            first_name='Ada',
            last_name='Lovelace',
            birthdate='2008-12-10',
            registration_date=timezone.localdate(),
        )
        math = Group.objects.create(
            group_number=1,
            subject='Mathematics',
            level=Level.PRIMARY,
            class_name=SchoolClass.FIRST_YEAR,
            teacher=teacher,
        )
        science = Group.objects.create(
            group_number=2,
            subject='Science',
            level=Level.PRIMARY,
            class_name=SchoolClass.SECOND_YEAR,
            teacher=teacher,
        )

        # Join both groups through the API — one enrollment each, one credit each.
        for group in (math, science):
            response = self.client.patch(
                reverse('AdminActions:group-detail', args=[group.id]),
                {'students': [student.id]},
                format='json',
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        revenues = self.client.get(reverse('AdminActions:teacher-revenue-list'))
        row = {r['full_name']: r for r in revenues.data}['Alan Turing']
        self.assertEqual(row['students_count'], 1)
        self.assertEqual(Decimal(row['current_month_revenue']), Decimal('2000.00'))

        # The ledger shows which group each credit came from.
        entries = self.client.get(
            reverse('AdminActions:teacher-revenue-revenue-entries', args=[teacher.id])
        )
        self.assertEqual(len(entries.data), 2)
        self.assertEqual({e['group_number'] for e in entries.data}, {1, 2})