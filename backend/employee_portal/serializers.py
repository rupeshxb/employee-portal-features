from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Employee, Project, DailyTask, Department, DailySubmission

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
    class Meta:
        model = Project
        fields = '__all__'

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
    
    # Nested projects for the colored pills
    projects = ProjectPillSerializer(many=True, read_only=True)
    
    # Getting the actual string name of the manager
    reports_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'full_name', 'email', 'avatar', 'phone_number', 
            'designation', 'status', 'projects', 'reports_to', 'reports_to_name'
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_reports_to_name(self, obj):
        if obj.reports_to:
            return obj.reports_to.user.get_full_name() or obj.reports_to.user.username
        return "Unassigned"