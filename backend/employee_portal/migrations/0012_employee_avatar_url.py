from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('employee_portal', '0011_designation_system_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='avatar_url',
            field=models.URLField(blank=True, null=True),
        ),
    ]
