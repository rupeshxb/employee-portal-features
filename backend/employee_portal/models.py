from django.db import models
from django.contrib.auth.models import User

# 1. Project Model
# Represents the teams/products (e.g., "Noveon", "Frilio")
class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    color_code = models.CharField(max_length=7, default="#FF5733") # Hex code for UI badges
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# 2. Employee Profile
# Extends the standard User to add "Designation" and "Department"
class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    designation = models.CharField(max_length=100, default="Software Engineer")
    department = models.CharField(max_length=100, default="Engineering")
    is_manager = models.BooleanField(default=False)
    
    def __str__(self):
        return self.user.username

# 3. Daily Task (The Main Feature)
# Linked to an Employee and a Project
class DailyTask(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="tasks")
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True)
    content = models.TextField() # The actual task text
    is_blocker = models.BooleanField(default=False) 
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True) # Sets time on creation
    updated_at = models.DateTimeField(auto_now=True)     # Updates on edit

    class Meta:
        ordering = ['-created_at'] # Shows newest tasks first by default

    def __str__(self):
        return f"{self.employee.user.username} - {self.created_at.date()}"
