from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    ChangePasswordSerializer,
    MyTokenObtainPairSerializer,
)


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ - obtain access/refresh tokens plus the user."""

    serializer_class = MyTokenObtainPairSerializer
    permission_classes = (permissions.AllowAny,)


class LogoutView(APIView):
    """POST /api/auth/logout/ - blacklist the provided refresh token."""

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'A refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            return Response(
                {'detail': 'The refresh token is invalid or already blacklisted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class ChangePasswordView(generics.GenericAPIView):
    """POST /api/auth/change-password/ - change the current user's password."""

    serializer_class = ChangePasswordSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'detail': 'Password updated successfully.'},
            status=status.HTTP_200_OK,
        )
