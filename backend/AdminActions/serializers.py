from rest_framework import serializers

from .models import Group, Student, Teacher, TeacherRevenueEntry


class StudentSerializer(serializers.ModelSerializer):
    sex_display = serializers.CharField(source='get_sex_display', read_only=True)
    level = serializers.SerializerMethodField()
    level_display = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()
    class_name_display = serializers.SerializerMethodField()
    # Expose the *effective* subscription state so an expired subscription
    # reports as False even though the stored flag may still be True.
    is_subscribed = serializers.SerializerMethodField()
    subscription_expiry_date = serializers.DateField(read_only=True)

    class Meta:
        model = Student
        fields = (
            'id',
            'first_name',
            'last_name',
            'full_name',
            'birthdate',
            'birthplace',
            'sex',
            'sex_display',
            'school',
            'father_name',
            'mother_first_name',
            'mother_last_name',
            'responsible_phone1',
            'responsible_phone2',
            'address',
            'registration_date',
            'is_subscribed',
            'renewal_subscription_date',
            'subscription_expiry_date',
            'level',
            'level_display',
            'class_name',
            'class_name_display',
        )
        read_only_fields = ('id', 'full_name', 'subscription_expiry_date')

    def get_is_subscribed(self, obj):
        return obj.is_subscription_active

    def _first_group(self, obj):
        try:
            return obj.groups.first()
        except (TypeError, AttributeError):
            return None

    def get_level(self, obj):
        group = self._first_group(obj)
        return group.level if group else None

    def get_level_display(self, obj):
        group = self._first_group(obj)
        return group.get_level_display() if group else None

    def get_class_name(self, obj):
        group = self._first_group(obj)
        return group.class_name if group else ''

    def get_class_name_display(self, obj):
        group = self._first_group(obj)
        return group.get_class_name_display() if group else ''


class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ('id', 'full_name')
        read_only_fields = ('id',)


class TeacherRevenueEntrySerializer(serializers.ModelSerializer):
    """One movement of revenue for a teacher (a single student/month entry)."""

    student_name = serializers.CharField(source='student.full_name', read_only=True)
    kind_display = serializers.CharField(source='get_kind_display', read_only=True)

    class Meta:
        model = TeacherRevenueEntry
        fields = (
            'id',
            'month',
            'kind',
            'kind_display',
            'student_name',
            'amount',
            'created_at',
        )


class TeacherRevenueSerializer(serializers.ModelSerializer):
    """A teacher together with their student count and monthly revenue.

    `students_count`, `current_month_revenue` and `last_month_revenue` are
    provided by the queryset annotations in the view.
    """

    students_count = serializers.IntegerField(read_only=True)
    current_month_revenue = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    last_month_revenue = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = Teacher
        fields = (
            'id',
            'full_name',
            'students_count',
            'current_month_revenue',
            'last_month_revenue',
        )


class GroupSerializer(serializers.ModelSerializer):
    students = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), many=True, required=False
    )
    students_detail = StudentSerializer(source='students', many=True, read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    class_name_display = serializers.CharField(
        source='get_class_name_display', read_only=True
    )

    class Meta:
        model = Group
        fields = (
            'id',
            'group_number',
            'subject',
            'level',
            'level_display',
            'class_name',
            'class_name_display',
            'students',
            'students_detail',
            'teacher',
            'teacher_name',
            'revenue_per_student',
        )
        read_only_fields = ('id', 'group_number')

    def validate(self, attrs):
        """Ensure `class_name` is one of the classes allowed for `level`."""
        level = attrs.get('level', getattr(self.instance, 'level', None))
        class_name = attrs.get('class_name', getattr(self.instance, 'class_name', ''))
        if class_name and level:
            allowed = Group.classes_for_level(level)
            if class_name not in allowed:
                raise serializers.ValidationError(
                    {'class_name': 'هذا القسم غير متاح للمستوى المختار.'}
                )
        return attrs