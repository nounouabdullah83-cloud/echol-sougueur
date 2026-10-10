from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Public representation of a user."""

    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'is_active',
            'is_staff',
            'date_joined',
            'last_login',
        )
        read_only_fields = ('id', 'email', 'is_active', 'is_staff', 'date_joined', 'last_login')


class ChangePasswordSerializer(serializers.Serializer):
    """Validate and apply a password change for the authenticated user."""

    old_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    new_password2 = serializers.CharField(
        write_only=True, style={'input_type': 'password'}, label='Confirm new password'
    )

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('The current password is incorrect.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password': 'The two passwords do not match.'})
        validate_password(attrs['new_password'], self.context['request'].user)
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Only superusers may log in; adds custom claims and the user to the response."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['full_name'] = user.get_full_name()
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_superuser:
            raise AuthenticationFailed(
                'Only superusers are allowed to log in.',
                code='no_active_account',
            )
        data['user'] = UserSerializer(self.user).data
        return data
