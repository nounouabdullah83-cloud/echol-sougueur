from django.contrib import admin

from .models import Group, Student, Teacher


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'first_name',
        'last_name',
        'sex',
        'school',
        'birthdate',
        'registration_date',
        'is_subscribed',
        'renewal_subscription_date',
    )
    list_filter = ('sex', 'is_subscribed')
    search_fields = ('first_name', 'last_name', 'school')


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name')
    search_fields = ('full_name',)


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'group_number',
        'subject',
        'level',
        'class_name',
        'teacher',
        'revenue_per_student',
    )
    list_filter = ('level', 'class_name')
    search_fields = ('group_number', 'subject', 'teacher__full_name')
    filter_horizontal = ('students',)
