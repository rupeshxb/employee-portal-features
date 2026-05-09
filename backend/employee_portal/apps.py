from django.apps import AppConfig


class EmployeePortalConfig(AppConfig):
    name = 'employee_portal'

    def ready(self):
        import employee_portal.signals  # noqa: F401
