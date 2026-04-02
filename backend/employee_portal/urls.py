from django.urls import path
from .views import (
    CustomLoginView, 
    DailyTaskListCreate, 
    DailyTaskDetail, 
    ProjectList, 
    ProjectDetail,         
    team_updates,          
    EmployeeProfileView,
    ChangePasswordView, 
    SubmitDailyTasksView,
    DepartmentListView,
    EmployeeListView,
    ManagerTeamUpdatesView,
    ManagerEmployeeOverview,
    ManagerListView,
    ManagerEmployeeDetailView,
    EmployeeDetailView,
    DesignationListView,    # <-- NEW
    TagListCreateView,      # <-- NEW
    TagDetailView           # <-- NEW
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
    path('projects/<int:pk>/', ProjectDetail.as_view(), name='project-detail'),
    
    # --- NEW API ENDPOINTS ---
    path('tasks/submit/', SubmitDailyTasksView.as_view(), name='submit-daily-tasks'),
    path('departments/', DepartmentListView.as_view(), name='departments'),
    path('employees/', EmployeeListView.as_view(), name='employee-list'), 
    
    # --- TEAM UPDATES ENDPOINTS ---
    path('manager/team-updates/', ManagerTeamUpdatesView.as_view(), name='manager_team_updates'),
    path('employee/team-updates/', team_updates, name='employee-team-updates'),
    
    # --- EMPLOYEE OVERVIEW & ADDITION ---
    path('manager/employee-overview/', ManagerEmployeeOverview.as_view(), name='manager-employee-overview'),
    
    # --- MANAGERS LIST endpoint for dropdowns and selection in the frontend ---
    path('manager/managers-list/', ManagerListView.as_view(), name='managers-list'),
    
    # --- EMPLOYEE DETAIL ENDPOINT for the modal in the frontend ---
    path('manager/employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),

    # --- DESIGNATIONS & TAGS ENDPOINTS ---
    path('designations/', DesignationListView.as_view(), name='designation-list'),
    path('tags/', TagListCreateView.as_view(), name='tag-list-create'),
    path('tags/<int:pk>/', TagDetailView.as_view(), name='tag-detail'),
]