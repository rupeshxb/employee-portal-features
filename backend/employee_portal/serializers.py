from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Employee, Project, DailyTask, Department, DailySubmission, Designation, Tag

# --- NEW: Department Serializer ---
class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

# --- 1. USER SERIALIZER ---
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


# --- 2. EXISTING SERIALIZERS (UPDATED) ---

class ProjectSerializer(serializers.ModelSerializer):
    team_size = serializers.SerializerMethodField()
    
    # NEW: Calculates counts for the Project Card (e.g., {"Front-end Developers": 4})
    team_structure = serializers.SerializerMethodField() 
    
    # NEW: Groups employee objects by department ID for the Project Modal
    assigned_employees_grouped = serializers.SerializerMethodField() 
    
    class Meta:
        model = Project
        fields = [
            'id', 
            'name', 
            'client_name', 
            'acronym', 
            'description', 
            'color_code', 
            'start_date', 
            'end_date', 
            'status',
            'team_size',
            'team_structure',             # Added
            'assigned_employees_grouped', # Added
            'assigned_employees'
        ]

    def get_team_size(self, obj):
        return obj.assigned_employees.count()

    def get_team_structure(self, obj):
        breakdown = {}
        for emp in obj.assigned_employees.all():
            dept_name = emp.department.name if emp.department else 'Unassigned'
            breakdown[dept_name] = breakdown.get(dept_name, 0) + 1
        return breakdown

    def get_assigned_employees_grouped(self, obj):
        grouped = {}
        for emp in obj.assigned_employees.all():
            dept_id = str(emp.department.id) if emp.department else 'unassigned'
            if dept_id not in grouped:
                grouped[dept_id] = []
            
            # Send back the minimal data needed for your TeamStructureSelect component
            grouped[dept_id].append({
                'id': emp.id,
                'full_name': emp.user.get_full_name() or emp.user.username,
                'avatar': emp.avatar.url if emp.avatar else None,
                'designation': emp.designation
            })
        return grouped

class EmployeeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    # NEW: Fetch department name directly for the UI
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 
            'username', 
            'first_name', 
            'last_name', 
            'full_name',
            'email',
            'designation', 
            'department', 
            'department_name', # Added
            'role',            # Added
            'avatar',
            'is_manager',      # Added for frontend logic
        ]

    def get_full_name(self, obj):
        if obj.user.first_name:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return obj.user.username


class DailyTaskSerializer(serializers.ModelSerializer):
    project_details = ProjectSerializer(source='project', read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), source='project', write_only=True
    )
    created_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = DailyTask
        fields = [
            'id', 
            'content', 
            'is_blocker', 
            'project_id', 
            'project_details', 
            'date',
            'created_at', 
            'created_at_formatted',
            'submission', # NEW: Allows linking to the daily wrapper
        ]
        read_only_fields = ['employee', 'created_at']

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime("%b %d, %Y")


# --- NEW: Manager's Daily Submission Serializer ---
class ManagerDailySubmissionSerializer(serializers.ModelSerializer):
    tasks = DailyTaskSerializer(many=True, read_only=True)

    class Meta:
        model = DailySubmission
        fields = ['id', 'date', 'submitted_at', 'meeting_count', 'tasks']


# --- 3. TEAM UPDATES SERIALIZER ---
class TeamUpdateEmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'designation', 'avatar']

    def get_full_name(self, obj):
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return obj.user.username

    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar.url
        name = self.get_full_name(obj)
        return f"https://ui-avatars.com/api/?name={name}&background=random&color=fff"
    

# --- 4. PROFILE & SETTINGS SERIALIZERS ---
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

class EmployeeProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')
    username = serializers.CharField(source='user.username', read_only=True)
    
    # Expose department_name for profile view safely
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'designation', 'department', 'department_name', 'avatar','is_manager', 'role']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        if 'email' in user_data:
            user.email = user_data['email']
        user.save()

        return super().update(instance, validated_data)
    

# --- 5. Project Pill Serializer ---
# We just need the name and color for the frontend pills
class ProjectPillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'color_code']

# --- 6. Employee Overview Serializer ---
class EmployeeOverviewSerializer(serializers.ModelSerializer):
    # Flattening user data so frontend doesn't have to dig for it
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    
    # NEW: Grab the string name of the department
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    # Nested projects for the colored pills
    projects = ProjectPillSerializer(many=True, read_only=True)
    
    # Getting the actual string name of the manager
    reports_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'full_name', 'email', 'avatar', 'phone_number', 
            'designation', 'department_name', 'status', 'projects', 
            'reports_to', 'reports_to_name', 'date_joined'
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_reports_to_name(self, obj):
        if obj.reports_to:
            return obj.reports_to.user.get_full_name() or obj.reports_to.user.username
        return "Unassigned"
    
# --- NEW: Manager Dropdown Serializer ---
class ManagerDropdownSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = ['id', 'username', 'full_name']

    def get_full_name(self, obj):
        # The try/except prevents a 500 crash if the linked User is missing
        try:
            full_name = obj.user.get_full_name()
            return full_name if full_name else obj.user.username
        except Exception:
            return "Unknown User"

# --- Employee Detail Serializer (For the Modal) ---
class EmployeeDetailSerializer(serializers.ModelSerializer):
    # Notice we removed read_only=True for these three fields so we can accept incoming data
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')
    
    username = serializers.CharField(source='user.username', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    reports_to_name = serializers.SerializerMethodField()
    date_joined = serializers.SerializerMethodField()
    
    # Map frontend 'reporting_manager' to 'reports_to'
    reporting_manager = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.filter(role='Manager'), 
        source='reports_to', 
        required=False, 
        allow_null=True
    )

    class Meta:
        model = Employee
        fields = [
            'id', 'first_name', 'last_name', 'email', 'username', 'avatar',
            'employee_id', 'pan_number', 'personal_email', 'phone_number', 
            'emergency_contact', 'employment_type', 'status', 'designation', 
            'department', 'department_name', 'reports_to_name', 'date_joined',
            'reporting_manager'
        ]

    def get_reports_to_name(self, obj):
        if obj.reports_to:
            return obj.reports_to.user.get_full_name() or obj.reports_to.user.username
        return "Unassigned"

    def get_date_joined(self, obj):
        if hasattr(obj, 'joined_date') and obj.joined_date:
            return obj.joined_date.strftime("%Y-%m-%d") # Format specifically for HTML Date Input
        return "-"

    # NEW: Override update to catch User model updates
    def update(self, instance, validated_data):
        # 1. Pop out User data
        user_data = validated_data.pop('user', {})
        user = instance.user
        
        # 2. Update User model fields
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        if 'email' in user_data:
            user.email = user_data['email']
        
        # Note: If you want to handle password changes here, you can intercept `password` 
        # from the request context and call `user.set_password()`, though it's usually 
        # handled in a separate endpoint.
        
        user.save()

        # 3. Update the rest of the Employee model fields
        return super().update(instance, validated_data)

class EmployeeCreateSerializer(serializers.ModelSerializer):
    # 1. Explicitly define User fields so the frontend can send them flatly
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    official_email = serializers.EmailField(write_only=True) # Maps to User.email

    # 2. Map frontend 'reporting_manager' to backend 'reports_to'
    reporting_manager = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.filter(role='Manager'), 
        source='reports_to', 
        required=False, 
        allow_null=True
    )

    class Meta:
        model = Employee
        fields = [
            # User Data
            'username', 'password', 'first_name', 'last_name', 'official_email',
            
            # New Form Data (Assuming you added these to your Employee model)
            'employee_id', 'joined_date', 'pan_number', 'personal_email', 
            'emergency_contact', 'employment_type', 
            
            # Existing Employee Data
            'designation', 'department', 'phone_number', 'status', 'reporting_manager'
        ]

    def create(self, validated_data):
        # 1. Pop out all the User-specific data
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('official_email')

        # 2. Create the User object (create_user automatically hashes the password)
        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            email=email
        )

        # 3. Create the Employee object with the remaining validated data
        employee = Employee.objects.create(user=user, **validated_data)
        
        return employee
    
# --- NEW: TAG & DESIGNATION SERIALIZERS ---
class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = ['id', 'name', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']
        
class TagSerializer(serializers.ModelSerializer):
    # This ensures that when we READ a tag, we get the full designation objects
    designations = DesignationSerializer(many=True, read_only=True)
    
    # This allows us to WRITE (create/update) a tag by sending an array of designation IDs from React
    designation_ids = serializers.PrimaryKeyRelatedField(
        queryset=Designation.objects.all(),
        many=True,
        write_only=True,
        source='designations'
    )

    class Meta:
        model = Tag
        fields = ['id', 'display_name', 'system_name', 'description', 'color', 'status', 'designations', 'designation_ids']