from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# --- 1. SAFE COLOR PALETTE ---
# These are the only colors allowed in the system.
# This prevents "Light Yellow" or invisible text issues.
PROJECT_COLORS = [
    ("#FF3B6B", "Noveon Pink"),
    ("#FF9F2D", "Frillio Orange"),
    ("#22C55E", "Success Green"),
    ("#D946EF", "Splendid Purple"),
    ("#0EA5E9", "Zofund Blue"),
    ("#06B6D4", "Informatics Cyan"),
    ("#8B5CF6", "Violet"),
    ("#EC4899", "Deep Pink"),
    ("#64748B", "Slate Grey"),      # Safe Neutral
    ("#F59E0B", "Amber"),           # Darker than yellow, readable with white text
    ("#3366ff", "Default Blue"),
]

# 2. Project Table (The 'Bucket' for tasks)
class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    # UPDATED: Added 'choices' to enforce safe colors
    color_code = models.CharField(
        max_length=20, 
        default="#3366ff", 
        choices=PROJECT_COLORS 
    )
    
    status = models.CharField(max_length=20, default="Active")

    def __str__(self):
        return self.name

# 3. Employee Table (Extends the standard User)
class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    designation = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    date_joined = models.DateTimeField(auto_now_add=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    def is_manager(self):
        return self.designation in ['Manager', 'Lead']

    def __str__(self):
        return self.user.username

# 4. Daily Task Table (The core data)
class DailyTask(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    content = models.TextField()
    is_blocker = models.BooleanField(default=False)
    
    date = models.DateField(default=timezone.now) 
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.user.username} - {self.date}"