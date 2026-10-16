from django.contrib import admin

from .models import Enrollment, Group, Student, Teacher


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
    )
    list_filter = ('sex',)
    search_fields = ('first_name', 'last_name', 'school')


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name')
    search_fields = ('full_name',)


class EnrollmentInline(admin.TabularInline):
    """Edit a group's memberships (and their subscriptions) inline."""

    model = Enrollment
    extra = 0
    autocomplete_fields = ('student',)


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
    inlines = (EnrollmentInline,)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'group',
        'student',
        'joined_on',
        'renewal_date',
        'is_active',
    )
    list_filter = ('is_active',)
    search_fields = ('student__first_name', 'student__last_name', 'group__group_number')
    autocomplete_fields = ('group', 'student')
