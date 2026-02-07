from django.urls import path
from .views import DailyTaskListCreate, DailyTaskDetail

urlpatterns = [
    # API Endpoint: http://127.0.0.1:8000/api/tasks/
    path('tasks/', DailyTaskListCreate.as_view(), name='task-list-create'),

    # API Endpoint: http://127.0.0.1:8000/api/tasks/1/ (for editing specific tasks)
    path('tasks/<int:pk>/', DailyTaskDetail.as_view(), name='task-detail'),
]