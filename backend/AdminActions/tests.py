from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Group, Student, Teacher

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
                'registration_date': '2026-09-01',
                'level': Student.Level.THIRD_MIDDLE,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        student = Student.objects.get(id=response.data['id'])
        self.assertEqual(student.full_name, 'Ada Lovelace')
        self.assertEqual(response.data['level_display'], 'ثالثة متوسط')

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
                'teacher': teacher.id,
                'students': [],
                'revenue_per_student': '1500.00',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        group = Group.objects.get(id=response.data['id'])
        self.assertEqual(group.group_number, 1)
        self.assertEqual(group.teacher, teacher)
        self.assertEqual(group.revenue_per_student, 1500)
        self.assertEqual(response.data['teacher_name'], 'Alan Turing')
