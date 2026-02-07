from rest_framework import serializers
from .models import Employee, Project, DailyTask

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'color_code']

class EmployeeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Employee
        fields = ['id', 'username', 'designation', 'department']

class DailyTaskSerializer(serializers.ModelSerializer):
    # This nesting allows the Frontend to read Project details easily
    project_details = ProjectSerializer(source='project', read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), source='project', write_only=True
    )

    created_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = DailyTask
        fields = [
            'id', 'content', 'is_blocker', 'project_id', 'project_details', 
            'created_at', 'created_at_formatted'
        ]

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime("%b %d, %Y")