from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver


@receiver(pre_save, sender='employee_portal.Employee')
def track_manager_before_save(sender, instance, **kwargs):
    """Store the previous is_manager value so post_save can detect a change."""
    if instance.pk:
        try:
            instance._was_manager = sender.objects.get(pk=instance.pk).is_manager
        except sender.DoesNotExist:
            instance._was_manager = False
    else:
        instance._was_manager = False


@receiver(post_save, sender='employee_portal.Employee')
def assign_project_manager_designation(sender, instance, created, **kwargs):
    """
    When an employee is marked as a manager (newly created or promoted),
    automatically assign the 'Project Manager' designation.
    """
    is_manager_now = instance.is_manager or instance.role == 'Manager'
    was_manager = getattr(instance, '_was_manager', False)
    became_manager = is_manager_now and (created or not was_manager)

    if not became_manager:
        return

    from employee_portal.models import Designation
    designation, _ = Designation.objects.get_or_create(
        name='Project Manager',
        defaults={'system_name': 'project_manager', 'status': 'Active'}
    )

    if instance.designation_id != designation.id:
        # Use queryset update to avoid re-triggering this signal
        sender.objects.filter(pk=instance.pk).update(designation=designation)


@receiver(post_delete, sender='employee_portal.Employee')
def delete_user_on_employee_delete(sender, instance, **kwargs):
    """Delete the linked auth User when an Employee is deleted, so the
    username is freed up for reuse. Employee.user uses on_delete=CASCADE,
    which only cascades User -> Employee, not the other way around."""
    user = getattr(instance, 'user', None)
    if user and user.pk:
        user.delete()
