from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

PASSWORD = 'S3cure-Passw0rd!'


class AuthFlowTests(APITestCase):
    login_url = reverse('AdminAuth:login')
    refresh_url = reverse('AdminAuth:token_refresh')
    logout_url = reverse('AdminAuth:logout')
    change_password_url = reverse('AdminAuth:change_password')

    def setUp(self):
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password=PASSWORD,
            first_name='Site',
            last_name='Admin',
        )

    def login(self, email='admin@example.com', password=PASSWORD):
        return self.client.post(
            self.login_url, {'email': email, 'password': password}, format='json'
        )

    def authenticate(self):
        login = self.login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        return login

    def test_register_endpoint_no_longer_exists(self):
        response = self.client.post('/api/auth/register/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_superuser_login_returns_tokens_and_user(self):
        response = self.login()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'admin@example.com')
        self.assertTrue(response.data['user']['is_staff'])

    def test_non_superuser_cannot_login(self):
        User.objects.create_user(email='user@example.com', password=PASSWORD)
        response = self.login(email='user@example.com')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inactive_superuser_cannot_login(self):
        self.admin.is_active = False
        self.admin.save(update_fields=['is_active'])
        response = self.login()
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_endpoint_no_longer_exists(self):
        self.authenticate()
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_refresh_token(self):
        login = self.login()
        response = self.client.post(
            self.refresh_url, {'refresh': login.data['refresh']}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_change_password(self):
        self.authenticate()
        response = self.client.post(
            self.change_password_url,
            {
                'old_password': PASSWORD,
                'new_password': 'N3w-Secure-Passw0rd!',
                'new_password2': 'N3w-Secure-Passw0rd!',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.check_password('N3w-Secure-Passw0rd!'))

    def test_logout_blacklists_refresh_token(self):
        login = self.authenticate()
        response = self.client.post(
            self.logout_url, {'refresh': login.data['refresh']}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)

        # The blacklisted refresh token can no longer be used.
        self.client.credentials()
        response = self.client.post(
            self.refresh_url, {'refresh': login.data['refresh']}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
