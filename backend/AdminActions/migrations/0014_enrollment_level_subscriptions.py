"""Introduce per-(student, group) enrollments with their own subscriptions.

One Enrollment row per existing group/student membership is backfilled from
the old auto M2M table, inheriting the student's single global subscription
dates (`joined_on`/`renewal_date` = registration/renewal date, `is_active` =
the old `is_subscribed` flag). Existing revenue entries are linked to the
matching enrollment (same student, group taught by the same teacher) so the
ledger keeps its group provenance. The student's own fields are dropped in
the follow-up migration 0015, after this backfill has read them.
"""

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


def create_enrollments(apps, schema_editor):
    """Copy every old M2M membership into an Enrollment with inherited dates."""
    Group = apps.get_model('AdminActions', 'Group')
    Student = apps.get_model('AdminActions', 'Student')
    Enrollment = apps.get_model('AdminActions', 'Enrollment')

    # The M2M field still points at its *old* auto-created through table here:
    # AlterField switches it to Enrollment only after this function runs.
    legacy_membership = Group.students.through

    students = {
        student.pk: student
        for student in Student.objects.only(
            'registration_date', 'renewal_subscription_date', 'is_subscribed'
        )
    }

    enrollments = []
    for row in legacy_membership.objects.all().iterator():
        student = students.get(row.student_id)
        if student is None:
            continue
        enrollments.append(
            Enrollment(
                group_id=row.group_id,
                student_id=row.student_id,
                joined_on=student.registration_date,
                renewal_date=(
                    student.renewal_subscription_date or student.registration_date
                ),
                is_active=student.is_subscribed,
            )
        )
    Enrollment.objects.bulk_create(enrollments, batch_size=500)


def drop_legacy_memberships(apps, schema_editor):
    Enrollment = apps.get_model('AdminActions', 'Enrollment')
    Enrollment.objects.all().delete()


def link_revenue_entries(apps, schema_editor):
    """Tag existing revenue entries with the enrollment they came from.

    Best effort: an entry is linked to the student's enrollment in a group
    taught by that same teacher (earliest enrollment wins when a teacher has
    several such groups).
    """
    TeacherRevenueEntry = apps.get_model('AdminActions', 'TeacherRevenueEntry')
    Enrollment = apps.get_model('AdminActions', 'Enrollment')

    for entry in TeacherRevenueEntry.objects.filter(enrollment__isnull=True).iterator():
        enrollment = (
            Enrollment.objects.filter(
                student_id=entry.student_id,
                group__teacher_id=entry.teacher_id,
            )
            .order_by('joined_on', 'id')
            .first()
        )
        if enrollment is not None:
            entry.enrollment = enrollment
            entry.save(update_fields=['enrollment'])


def unlink_revenue_entries(apps, schema_editor):
    TeacherRevenueEntry = apps.get_model('AdminActions', 'TeacherRevenueEntry')
    TeacherRevenueEntry.objects.update(enrollment=None)


class Migration(migrations.Migration):

    dependencies = [
        ('AdminActions', '0013_remove_teacherrevenueentry_unique_teacher_student_month_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Enrollment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('joined_on', models.DateField(default=django.utils.timezone.localdate, help_text='Date the student joined this group.')),
                ('renewal_date', models.DateField(default=django.utils.timezone.localdate, help_text="Start of this enrollment's current subscription period. Defaults to the day the student joined the group.")),
                ('is_active', models.BooleanField(default=True, help_text='Stored subscription flag for this enrollment.')),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='enrollments', to='AdminActions.group')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='enrollments', to='AdminActions.student')),
            ],
            options={
                'verbose_name': 'enrollment',
                'verbose_name_plural': 'enrollments',
                'ordering': ('joined_on', 'id'),
            },
        ),
        migrations.AddField(
            model_name='teacherrevenueentry',
            name='enrollment',
            field=models.ForeignKey(blank=True, help_text='The enrollment this credit belongs to, when known.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='revenue_entries', to='AdminActions.enrollment'),
        ),
        migrations.RunPython(create_enrollments, drop_legacy_memberships),
        migrations.RunPython(link_revenue_entries, unlink_revenue_entries),
        # Switching an M2M to a custom through model emits no SQL (the new
        # table was already created above), but Django's schema editor refuses
        # to *attempt* it — so update the migration state only.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='group',
                    name='students',
                    field=models.ManyToManyField(blank=True, related_name='groups', through='AdminActions.Enrollment', to='AdminActions.student'),
                ),
            ],
            database_operations=[],
        ),
        # The old auto-created M2M table is orphaned by the switch to a custom
        # through model — Django never drops it for us.
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS "AdminActions_group_students";',
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AddConstraint(
            model_name='enrollment',
            constraint=models.UniqueConstraint(fields=('group', 'student'), name='unique_enrollment_per_group_student'),
        ),
    ]
