from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# --- 1. DEPARTMENT TABLE ---
class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# --- 2. DESIGNATION TABLE (NEW) ---
class Designation(models.Model):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    )
    name = models.CharField(max_length=255, unique=True)
    system_name = models.CharField(max_length=255, unique=True, null=True, blank=True, help_text="Internal identifier, e.g. software_engineer")
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# --- 3. TAG TABLE (NEW) ---
class Tag(models.Model):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    )

    display_name = models.CharField(max_length=100, unique=True)
    system_name = models.CharField(max_length=100, unique=True, help_text="e.g., developers")
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=20, default="#000000")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    
    # The crucial link: A tag can group multiple designations together
    designations = models.ManyToManyField(Designation, related_name='tags', blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name

# --- 4. PROJECT TABLE ---
class Project(models.Model):
    name = models.CharField(max_length=100)
    client_name = models.CharField(max_length=100, blank=True, null=True)  
    acronym = models.CharField(max_length=15, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    # This acts as our "Accent Color" from the Figma design
    color_code = models.CharField(max_length=20, default="#3366ff")
    
    start_date = models.DateField(blank=True, null=True)  
    end_date = models.DateField(blank=True, null=True)    
    status = models.CharField(max_length=20, default="Active")

    def __str__(self):
        return self.name

# --- 5. EMPLOYEE MODEL TABLE (CLEANED UP & UPDATED) ---
class Employee(models.Model):
    ROLE_CHOICES = (
        ('Employee', 'Employee'),
        ('Manager', 'Manager'),
    )
    
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    )

    EMPLOYMENT_TYPE_CHOICES = (
        ('Full-Time', 'Full-Time'),
        ('Part-Time', 'Part-Time'),
        ('Contract', 'Contract'),
        ('Internship', 'Internship'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # --- NEW FIELDS FROM FRONTEND ---
    employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='Full-Time')
    personal_email = models.EmailField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=20, blank=True, null=True)
    pan_number = models.CharField(max_length=20, blank=True, null=True)
    joined_date = models.DateField(null=True, blank=True)
    # --------------------------------
    
    # --- UPDATED: Designation is now perfectly linked to the Designation Table ---
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    
    is_manager = models.BooleanField(default=False, help_text="Check this box if the employee is a manager.")
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    temp_migration_fix = models.BooleanField(default=False)
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Employee')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    
    reports_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates', limit_choices_to={'role': 'Manager'})
    projects = models.ManyToManyField('Project', related_name='assigned_employees', blank=True)
    
    date_joined = models.DateTimeField(auto_now_add=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        full_name = self.user.get_full_name()
        return full_name if full_name else self.user.username

# --- 6. DAILY SUBMISSION TABLE ---
class DailySubmission(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='daily_submissions')
    date = models.DateField(default=timezone.now)
    submitted_at = models.DateTimeField(auto_now=True) 
    meeting_count = models.PositiveIntegerField(default=0) 

    class Meta:
        unique_together = ('employee', 'date')

    def __str__(self):
        return f"{self.employee.user.username} - {self.date}"

# --- 7. DAILY TASK TABLE ---
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