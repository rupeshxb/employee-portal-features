from django.core.management.base import BaseCommand
from employee_portal.models import Employee, Designation


class Command(BaseCommand):
    help = 'Assign Project Manager designation to all existing managers.'

    def handle(self, *args, **kwargs):
        designation, created = Designation.objects.get_or_create(
            name='Project Manager',
            defaults={'system_name': 'project_manager', 'status': 'Active'}
        )

        if created:
            self.stdout.write(self.style.SUCCESS('Created "Project Manager" designation.'))

        managers = Employee.objects.filter(
            is_manager=True
        ).exclude(designation=designation)

        count = managers.count()
        managers.update(designation=designation)

        self.stdout.write(self.style.SUCCESS(
            f'Updated {count} manager(s) to "Project Manager" designation.'
        ))
