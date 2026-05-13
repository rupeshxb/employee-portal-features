from django.contrib.auth.models import User
from django.test import TestCase

from employee_portal.models import Employee


class EmployeeDeleteFreesUsernameTests(TestCase):
    def test_deleting_employee_deletes_linked_user(self):
        user = User.objects.create_user(username="test_manager", password="pw")
        employee = Employee.objects.create(user=user)

        employee.delete()

        self.assertFalse(
            User.objects.filter(username="test_manager").exists(),
            "Deleting an Employee should also delete its linked User.",
        )

    def test_username_can_be_reused_after_employee_delete(self):
        user = User.objects.create_user(username="project_manager", password="pw")
        employee = Employee.objects.create(user=user)
        employee.delete()

        # Should not raise IntegrityError on the unique username constraint.
        new_user = User.objects.create_user(username="project_manager", password="pw")
        Employee.objects.create(user=new_user)

        self.assertEqual(
            User.objects.filter(username="project_manager").count(), 1
        )
