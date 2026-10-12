from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Group, Level, SchoolClass, Sex, Student, Teacher

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
        for name in ('student-list', 'teacher-list', 'group-list'):
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

    def test_create_group(self):
        teacher = Teacher.objects.create(full_name='Alan Turing')
        response = self.client.post(
            reverse('AdminActions:group-list'),
            {
                'group_number': 1,
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
        self.assertEqual(group.group_number, 1)
        self.assertEqual(group.subject, 'Mathematics')
        self.assertEqual(group.level, Level.MIDDLE)
        self.assertEqual(group.class_name, SchoolClass.THIRD_YEAR)
        self.assertEqual(response.data['level_display'], 'متوسطة')
        self.assertEqual(response.data['class_name_display'], 'السنة الثالثة')
        self.assertEqual(group.teacher, teacher)
        self.assertEqual(group.revenue_per_student, 1500)
        self.assertEqual(response.data['teacher_name'], 'Alan Turing')

    def test_group_rejects_class_outside_level(self):
        response = self.client.post(
            reverse('AdminActions:group-list'),
            {
                'group_number': 1,
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