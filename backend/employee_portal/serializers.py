from rest_framework import serializers
from .models import Employee, Project, DailyTask
from django.contrib.auth.models import User

# --- 1. USER SERIALIZER (NEW) ---
# This is required to handle raw User model data
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


# --- 2. EXISTING SERIALIZERS (UPDATED) ---

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

# UPDATED: Added first_name, last_name, full_name, and avatar here
# This fixes the "Header loading..." issue.
class EmployeeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()

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
            'avatar'
        ]

    def get_full_name(self, obj):
        if obj.user.first_name:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return obj.user.username


class DailyTaskSerializer(serializers.ModelSerializer):
    # --- READ ONLY: Nested Project Details for the UI Cards ---
    project_details = ProjectSerializer(source='project', read_only=True)

    # --- WRITE ONLY: Accepting IDs from the Frontend Form ---
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), source='project', write_only=True
    )

    # Custom Date Formatting
    created_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = DailyTask
        fields = [
            'id', 
            'content', 
            'is_blocker', 
            'project_id',      # Input
            'project_details', # Output
            'date',
            'created_at', 
            'created_at_formatted',
        ]
        read_only_fields = ['employee', 'created_at']

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime("%b %d, %Y")


# --- 3. TEAM UPDATES SERIALIZER ---

class TeamUpdateEmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'designation', 'avatar']

    def get_full_name(self, obj):
        # Tries to get First+Last, falls back to Username
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return obj.user.username

    def get_avatar(self, obj):
        # Generates a dynamic avatar based on their name if no image exists
        if obj.avatar:
            return obj.avatar.url
        name = self.get_full_name(obj)
        return f"https://ui-avatars.com/api/?name={name}&background=random&color=fff"
    

# --- 4. PROFILE & SETTINGS SERIALIZERS ---

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

class EmployeeProfileSerializer(serializers.ModelSerializer):
    # We include User fields (first_name, last_name, email) via read/write logic
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'designation', 'department', 'avatar']

    def update(self, instance, validated_data):
        # 1. Update User Model Fields
        user_data = validated_data.pop('user', {})
        user = instance.user
        
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        if 'email' in user_data:
            user.email = user_data['email']
        user.save()

        # 2. Update Employee Model Fields (Avatar, etc)
        return super().update(instance, validated_data)