from rest_framework import serializers
from .models import Employee, Project, DailyTask

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Employee
        fields = ['id', 'username', 'designation', 'department']

class DailyTaskSerializer(serializers.ModelSerializer):
    # --- READ ONLY: Nested Project Details for the UI Cards ---
    project_details = ProjectSerializer(source='project', read_only=True)

    # --- WRITE ONLY: Accepting IDs from the Frontend Form ---
    # Maps 'project_id' from frontend -> 'project' in database
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), source='project', write_only=True
    )
    # Maps 'employee_id' from frontend -> 'employee' in database
    employee_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), source='employee', write_only=True
    )

    # Custom Date Formatting
    created_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = DailyTask  # <--- This connects to your DailyTask model
        fields = [
            'id', 
            'content', 
            'is_blocker', 
            'project_id',      # Input
            'employee_id',     # Input
            'project_details', # Output
            'created_at', 
            'created_at_formatted'
        ]

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime("%b %d, %Y")