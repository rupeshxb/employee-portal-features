from django.urls import path
from .views import DailyTaskListCreate, DailyTaskDetail, ProjectList

urlpatterns = [
    # Tasks
    path('tasks/', DailyTaskListCreate.as_view(), name='task-list-create'),
    path('tasks/<int:pk>/', DailyTaskDetail.as_view(), name='task-detail'),

    # Projects (Add this line!)
    path('projects/', ProjectList.as_view(), name='project-list'),
]