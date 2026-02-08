from django.urls import path
from .views import (
    CustomLoginView, 
    DailyTaskListCreate, 
    DailyTaskDetail, 
    ProjectList, 
    team_updates,
    EmployeeProfileView,
    ChangePasswordView
)

urlpatterns = [
    # Auth
    path('login/', CustomLoginView.as_view(), name='login'),

    # Profile & Settings
    path('profile/', EmployeeProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # Tasks
    path('tasks/', DailyTaskListCreate.as_view(), name='task-list-create'),
    path('tasks/<int:pk>/', DailyTaskDetail.as_view(), name='task-detail'),

    # Projects
    path('projects/', ProjectList.as_view(), name='project-list'),

    # Team Updates
    path('team-updates/', team_updates, name='team-updates'),
]