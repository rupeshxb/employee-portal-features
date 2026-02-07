from rest_framework import generics
from .models import DailyTask, Employee
from .serializers import DailyTaskSerializer

# 1. List all Tasks & Create new Task
class DailyTaskListCreate(generics.ListCreateAPIView):
    queryset = DailyTask.objects.all().order_by('-created_at')
    serializer_class = DailyTaskSerializer

    def perform_create(self, serializer):
        # Automatically assign the task to the first employee found (mock logic)
        employee = Employee.objects.first() 
        serializer.save(employee=employee)

# 2. Edit or Delete a specific Task
class DailyTaskDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = DailyTask.objects.all()
    serializer_class = DailyTaskSerializer
    