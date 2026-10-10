from django.contrib import admin

from .models import Group, Student, Subject, Teacher


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'level', 'birthdate', 'registration_date')
    list_filter = ('level',)
    search_fields = ('first_name', 'last_name')


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name')
    search_fields = ('full_name',)


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'group_number', 'teacher', 'revenue_per_student')
    search_fields = ('group_number', 'teacher__full_name')
    filter_horizontal = ('students',)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)
    filter_horizontal = ('teachers', 'groups')
