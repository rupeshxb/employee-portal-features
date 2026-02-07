from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# 1. Project Table (The 'Bucket' for tasks)
class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    color_code = models.CharField(max_length=20, default="#3366ff") # Hex color for UI
    status = models.CharField(max_length=20, default="Active")

    def __str__(self):
        return self.name

# 2. Employee Table (Extends the standard User)
class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    designation = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    # Simple check for permissions later
    def is_manager(self):
        return self.designation in ['Manager', 'Lead']

    def __str__(self):
        return self.user.username

# 3. Daily Task Table (The core data)
class DailyTask(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    content = models.TextField()
    is_blocker = models.BooleanField(default=False)
    
    # NEW FIELD: This stores the date you select in the UI
    date = models.DateField(default=timezone.now) 
    
    # These stay for audit purposes (system timestamps)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.user.username} - {self.date}"