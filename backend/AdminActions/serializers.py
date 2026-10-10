from rest_framework import serializers

from .models import Group, Student, Subject, Teacher


class StudentSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = Student
        fields = (
            'id',
            'first_name',
            'last_name',
            'full_name',
            'birthdate',
            'registration_date',
            'level',
            'level_display',
        )
        read_only_fields = ('id', 'full_name')


class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ('id', 'full_name')
        read_only_fields = ('id',)


class GroupSerializer(serializers.ModelSerializer):
    students = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), many=True, required=False
    )
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)

    class Meta:
        model = Group
        fields = (
            'id',
            'group_number',
            'students',
            'teacher',
            'teacher_name',
            'revenue_per_student',
        )
        read_only_fields = ('id',)


class SubjectSerializer(serializers.ModelSerializer):
    teachers = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(), many=True, required=False
    )
    groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(), many=True, required=False
    )

    class Meta:
        model = Subject
        fields = ('id', 'name', 'teachers', 'groups')
        read_only_fields = ('id',)
