from rest_framework import generics
from .models import DailyTask, Employee, Project
from .serializers import DailyTaskSerializer, ProjectSerializer

# --- PROJECT VIEWS (Required for Dropdown) ---

class ProjectList(generics.ListAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

# --- DAILY TASK VIEWS ---

# 1. List all Tasks & Create new Task
class DailyTaskListCreate(generics.ListCreateAPIView):
    # Sort by the user-selected DATE first, then by creation time
    queryset = DailyTask.objects.all().order_by('-date', '-created_at')
    serializer_class = DailyTaskSerializer

    def perform_create(self, serializer):
        # Automatically assign the task to the first employee found (mock logic)
        # You can later change this to: employee = self.request.user.employee
        employee = Employee.objects.first() 
        serializer.save(employee=employee)

# 2. Edit or Delete a specific Task
class DailyTaskDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = DailyTask.objects.all()
    serializer_class = DailyTaskSerializer