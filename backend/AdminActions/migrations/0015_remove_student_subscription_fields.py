"""Drop the student's global subscription scalars.

Their values were migrated onto per-group Enrollment rows in 0014; the API
now derives student-level subscription state from enrollments instead.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('AdminActions', '0014_enrollment_level_subscriptions'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='student',
            name='is_subscribed',
        ),
        migrations.RemoveField(
            model_name='student',
            name='renewal_subscription_date',
        ),
    ]
