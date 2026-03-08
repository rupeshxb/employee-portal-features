from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# --- 1. SAFE COLOR PALETTE ---
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

# --- 2. DEPARTMENT TABLE (NEW) ---
class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# --- 3. PROJECT TABLE ---
class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    color_code = models.CharField(
        max_length=20, 
        default="#3366ff", 
        choices=PROJECT_COLORS 
    )
    
    status = models.CharField(max_length=20, default="Active")

    def __str__(self):
        return self.name

# --- 4. EMPLOYEE TABLE ---
class Employee(models.Model):
    ROLE_CHOICES = (
        ('Employee', 'Employee'),
        ('Manager', 'Manager'),
    )
    
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    designation = models.CharField(max_length=100)
    is_manager = models.BooleanField(default=False, help_text="Check this box if the employee is a manager.")
    
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    temp_migration_fix = models.BooleanField(default=False)
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Employee')
    
    # --- NEW FIELDS FOR EMPLOYEE OVERVIEW ---
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    
    # Self-referential key: An employee reports to another employee (the manager)
    reports_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates', limit_choices_to={'role': 'Manager'})
    
    # Many-to-Many: An employee can be assigned to multiple projects
    projects = models.ManyToManyField('Project', related_name='assigned_employees', blank=True)
    # ----------------------------------------
    
    date_joined = models.DateTimeField(auto_now_add=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        # Fallback to email or username if full name isn't set
        full_name = self.user.get_full_name()
        return full_name if full_name else self.user.username

# --- 5. DAILY SUBMISSION TABLE ---
class DailySubmission(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='daily_submissions')
    date = models.DateField(default=timezone.now)
    
    # CHANGE THIS LINE: from auto_now_add=True to auto_now=True
    submitted_at = models.DateTimeField(auto_now=True) 
    
    meeting_count = models.PositiveIntegerField(default=0) 

    class Meta:
        unique_together = ('employee', 'date')

    def __str__(self):
        return f"{self.employee.user.username} - {self.date}"

# --- 6. DAILY TASK TABLE ---
class DailyTask(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    
    submission = models.ForeignKey(DailySubmission, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    
    content = models.TextField()
    is_blocker = models.BooleanField(default=False)
    
    date = models.DateField(default=timezone.now) 
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.user.username} - {self.date}"
    