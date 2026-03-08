from django.urls import path
from .views import (
    CustomLoginView, 
    DailyTaskListCreate, 
    DailyTaskDetail, 
    ProjectList, 
    team_updates,           
    EmployeeProfileView,
    ChangePasswordView, 
    SubmitDailyTasksView,
    DepartmentListView,
    EmployeeListView,
    ManagerTeamUpdatesView,
    ManagerEmployeeOverview
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
    
    # --- NEW API ENDPOINTS ---
    path('tasks/submit/', SubmitDailyTasksView.as_view(), name='submit-daily-tasks'),
    path('departments/', DepartmentListView.as_view(), name='departments'),
    path('employees/', EmployeeListView.as_view(), name='employee-list'), # <-- PATH ADDED HERE
    
    # --- TEAM UPDATES ENDPOINTS ---
    # Manager's view
    path('manager/team-updates/', ManagerTeamUpdatesView.as_view(), name='manager_team_updates'),
    
    # Employee's view
    path('employee/team-updates/', team_updates, name='employee-team-updates'),
    
    #EmployeeOverview
    path('manager/employee-overview/', ManagerEmployeeOverview.as_view(), name='manager-employee-overview'),
]