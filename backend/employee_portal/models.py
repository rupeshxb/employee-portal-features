from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# --- 2. DEPARTMENT TABLE (NEW) ---
class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# --- 3. PROJECT TABLE ---
class Project(models.Model):
    name = models.CharField(max_length=100)
    client_name = models.CharField(max_length=100, blank=True, null=True)  
    acronym = models.CharField(max_length=15, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    # This acts as our "Accent Color" from the Figma design
    color_code = models.CharField(
        max_length=20, 
        default="#3366ff"
    )
    
    start_date = models.DateField(blank=True, null=True)  # NEW
    end_date = models.DateField(blank=True, null=True)    # NEW
    
    status = models.CharField(max_length=20, default="Active")

    def __str__(self):
        return self.name

# --- 4. EMPLOYEE MODEL TABLE ---
class Employee(models.Model):
    ROLE_CHOICES = (
        ('Employee', 'Employee'),
        ('Manager', 'Manager'),
    )
    
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    )

    # NEW: Choices for the dropdown in React
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
    joined_date = models.DateField(null=True, blank=True) # The date from the form
    # --------------------------------
    
    designation = models.CharField(max_length=100)
    is_manager = models.BooleanField(default=False, help_text="Check this box if the employee is a manager.")
    
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    temp_migration_fix = models.BooleanField(default=False)
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Employee')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    
    reports_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates', limit_choices_to={'role': 'Manager'})
    projects = models.ManyToManyField('Project', related_name='assigned_employees', blank=True)
    
    date_joined = models.DateTimeField(auto_now_add=True) # Internal DB creation time
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        full_name = self.user.get_full_name()
        return full_name if full_name else self.user.username
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
    