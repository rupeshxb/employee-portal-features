from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import authenticate
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import timedelta, date
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from .serializers import DepartmentSerializer
from rest_framework.pagination import PageNumberPagination

# Use local imports since we are in the same app
from .models import DailyTask, Employee, Project, Department, DailySubmission
from .serializers import (
    DailyTaskSerializer, 
    ProjectSerializer, 
    TeamUpdateEmployeeSerializer,
    ChangePasswordSerializer, 
    EmployeeProfileSerializer,
    DepartmentSerializer,
    EmployeeSerializer,
    ManagerDailySubmissionSerializer,
    EmployeeOverviewSerializer
)


# --- NEW: EMPLOYEE DAILY SUBMISSION ENDPOINT ---
class SubmitDailyTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not hasattr(request.user, 'employee'):
            return Response({"error": "Only employees can submit tasks."}, status=status.HTTP_403_FORBIDDEN)
        
        employee = request.user.employee
        
        date_str = request.data.get('date')
        if date_str:
            target_date = parse_date(date_str)
        else:
            target_date = timezone.now().date()
            
        meeting_count = request.data.get('meeting_count', 0)
        
        try:
            meeting_count = int(meeting_count)
        except ValueError:
            return Response({"error": "Meeting count must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        submission, created = DailySubmission.objects.update_or_create(
            employee=employee,
            date=target_date,
            defaults={
                'meeting_count': meeting_count,
            }
        )

        tasks_updated = DailyTask.objects.filter(
            employee=employee,
            date=target_date
        ).update(submission=submission)

        return Response({
            "message": "Tasks submitted successfully!",
            "submission_id": submission.id,
            "meeting_count": submission.meeting_count,
            "tasks_linked": tasks_updated,
            "submitted_at": submission.submitted_at
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

# --- NEW: DEPARTMENT LIST VIEW ---
class DepartmentListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        departments = Department.objects.all().order_by('name')
        return Response(DepartmentSerializer(departments, many=True).data)

# --- NEW: EMPLOYEE LIST VIEW (Fixes your 404!) ---
class EmployeeListView(generics.ListAPIView):
    queryset = Employee.objects.select_related('user', 'department').all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

# --- 1. PROJECT VIEWS ---
class ProjectList(generics.ListAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

# --- 2. DAILY TASK VIEWS ---
class DailyTaskListCreate(generics.ListCreateAPIView):
    serializer_class = DailyTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if hasattr(self.request.user, 'employee'):
            return DailyTask.objects.filter(employee=self.request.user.employee).order_by('-date', '-created_at')
        return DailyTask.objects.none()

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user.employee)

class DailyTaskDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = DailyTask.objects.all()
    serializer_class = DailyTaskSerializer
    permission_classes = [IsAuthenticated]


from datetime import date, timedelta
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# --- 3. TEAM UPDATES VIEW (STANDARD EMPLOYEES) ---
@api_view(['GET'])
def team_updates(request):
    date_param = request.GET.get('date')
    search_query = request.GET.get('search', '')
    project_filter = request.GET.get('project', 'All Projects')
    role_filter = request.GET.get('role', 'All Roles')

    is_specific_date = bool(date_param) 
    if date_param:
        target_date = parse_date(date_param)
    else:
        target_date = date.today()
    
    if not target_date: target_date = date.today()
    prev_date = target_date - timedelta(days=1)

    employees = Employee.objects.select_related('user').all()

    if search_query:
        employees = employees.filter(
            Q(user__username__icontains=search_query) | 
            Q(user__first_name__icontains=search_query) |
            Q(user__last_name__icontains=search_query)
        )

    if role_filter != 'All Roles':
        employees = employees.filter(designation__iexact=role_filter)

    response_data = []

    for emp in employees:
        tasks_query = DailyTask.objects.filter(employee=emp)

        if project_filter != 'All Projects':
            tasks_query = tasks_query.filter(project__name=project_filter)

        today_tasks = tasks_query.filter(date=target_date, is_blocker=False)
        yesterday_tasks = tasks_query.filter(date=prev_date, is_blocker=False)
        blockers = tasks_query.filter(date=target_date, is_blocker=True)
        previous_tasks = DailyTask.objects.none()

        if not is_specific_date:
            previous_tasks = tasks_query.filter(date__lt=prev_date, is_blocker=False)

        has_activity = (today_tasks.exists() or yesterday_tasks.exists() or blockers.exists() or previous_tasks.exists())

        if not has_activity:
            continue 

        emp_data = TeamUpdateEmployeeSerializer(emp).data
        emp_data['tasks'] = {
            'today': DailyTaskSerializer(today_tasks, many=True).data,
            'yesterday': DailyTaskSerializer(yesterday_tasks, many=True).data,
            'blockers': DailyTaskSerializer(blockers, many=True).data,
            'previous': DailyTaskSerializer(previous_tasks, many=True).data
        }
        response_data.append(emp_data)

    return Response(response_data)


#--- 3. TEAM UPDATES VIEW (MANAGERS) ---
class ManagerTeamUpdatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_superuser = request.user.is_superuser
        
        is_manager = False
        if hasattr(request.user, 'employee'):
            emp = request.user.employee
            if (emp.role and emp.role.lower() == 'manager') or getattr(emp, 'is_manager', False):
                is_manager = True

        if not (is_superuser or is_manager):
            return Response({
                "error": "Forbidden. Managers only.",
                "debug_info": f"Username: {request.user.username}"
            }, status=403)

        # 1. Date Filter Logic
        date_str = request.query_params.get('date', 'all').strip().lower()
        real_today = timezone.now().date()
        real_yesterday = real_today - timedelta(days=1)

        # Determine target_date for the daily submission wrapper (defaults to today)
        if date_str in ['all', '', 'today']:
            target_date = real_today
        elif date_str == 'yesterday':
            target_date = real_yesterday
        else:
            target_date = parse_date(date_str) or real_today

        # Filters
        department_filter = request.query_params.get('department', 'All')
        time_filter = request.query_params.get('time', 'Time') 
        search_query = request.query_params.get('search', '')
        project_filter = request.query_params.get('project', 'All Projects')

        employees = Employee.objects.select_related('user').filter(role='Employee')

        if department_filter and department_filter.lower() != 'all':
            employees = employees.filter(department__name__iexact=department_filter)

        total_in_department = employees.count()

        if search_query:
            employees = employees.filter(
                Q(user__username__icontains=search_query) | 
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query)
            )

        formatted_employees = []

        for emp in employees:
            # Submission logic remains exactly the same
            submission = DailySubmission.objects.filter(employee=emp, date=target_date).first()
            latest_task = DailyTask.objects.filter(employee=emp, date=target_date).order_by('-created_at').first()
            
            if time_filter == 'not_submitted' and (submission is not None or latest_task is not None):
                continue 
                
            actual_submit_time = None
            if submission:
                actual_submit_time = submission.submitted_at
            elif latest_task:
                actual_submit_time = latest_task.created_at

            if actual_submit_time:
                submit_hour = timezone.localtime(actual_submit_time).hour
                if time_filter == 'before_10' and submit_hour >= 10: continue 
                if time_filter == 'after_10' and submit_hour < 10: continue
            elif time_filter in ['before_10', 'after_10']:
                continue 

            # NEW TASK FETCHING LOGIC: Order by date and created_at (latest first)
            tasks_query = DailyTask.objects.filter(employee=emp).order_by('-date', '-created_at')
            
            if project_filter != 'All Projects':
                tasks_query = tasks_query.filter(project__name__iexact=project_filter)

            # Dynamic Bucketing based on what the user requested
            if date_str in ['all', '']:
                today_tasks = tasks_query.filter(date=real_today, is_blocker=False)
                yesterday_tasks = tasks_query.filter(date=real_yesterday, is_blocker=False)
                previous_tasks = tasks_query.exclude(date__in=[real_today, real_yesterday]).filter(is_blocker=False)
                blockers = tasks_query.filter(is_blocker=True)
            elif date_str == 'today':
                today_tasks = tasks_query.filter(date=real_today, is_blocker=False)
                yesterday_tasks = tasks_query.none()
                previous_tasks = tasks_query.none()
                blockers = tasks_query.filter(date=real_today, is_blocker=True)
            elif date_str == 'yesterday':
                today_tasks = tasks_query.none()
                yesterday_tasks = tasks_query.filter(date=real_yesterday, is_blocker=False)
                previous_tasks = tasks_query.none()
                blockers = tasks_query.filter(date=real_yesterday, is_blocker=True)
            else:
                today_tasks = tasks_query.none()
                yesterday_tasks = tasks_query.none()
                previous_tasks = tasks_query.filter(date=target_date, is_blocker=False)
                blockers = tasks_query.filter(date=target_date, is_blocker=True)
            
            submitted_time_iso = actual_submit_time.isoformat() if actual_submit_time else None

            emp_data = TeamUpdateEmployeeSerializer(emp).data
            
            emp_data['submittedTime'] = submitted_time_iso
            emp_data['meetings'] = submission.meeting_count if submission else 0
            emp_data['blockers'] = blockers.count()
            
            # Fill the buckets for React
            emp_data['tasks'] = {
                'today': DailyTaskSerializer(today_tasks, many=True).data,
                'yesterday': DailyTaskSerializer(yesterday_tasks, many=True).data,
                'previous': DailyTaskSerializer(previous_tasks, many=True).data,
                'blockers': DailyTaskSerializer(blockers, many=True).data,
            }
            
            # Append the wrapper for sorting
            formatted_employees.append({
                "sort_time": actual_submit_time,
                "data": emp_data
            })
            
        # ==========================================
        # OUTSIDE THE FOR LOOP - SORTING LOGIC
        # ==========================================
        def sort_by_latest(item):
            t = item['sort_time']
            if t is None:
                return (0, 0) # 0 priority, pushes them to the bottom
            return (1, t.timestamp()) # 1 priority, then sort by the numeric timestamp

        # Sort the list in place, descending order (reverse=True)
        formatted_employees.sort(key=sort_by_latest, reverse=True)

        # Extract just the clean data back out for the frontend
        final_employees_list = [item['data'] for item in formatted_employees]

        # Ensure we return final_employees_list here!
        return Response({
            "total_in_department": total_in_department,
            "employees": final_employees_list
        })
        
# --- 4. AUTHENTICATION VIEWS (UPDATED) ---
class CustomLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            employee = getattr(user, 'employee', None)
            
            designation = "User"
            portal_role = "Employee" 
            avatar = None
            employee_id = None
            department_name = None

            if employee:
                employee_id = employee.pk
                designation = employee.designation
                portal_role = employee.role 
                is_manager_status = employee.is_manager
                avatar = employee.avatar.url if employee.avatar else None
                if employee.department:
                    department_name = employee.department.name
            elif user.is_superuser:
                designation = "Admin"
                portal_role = "Manager" 
                is_manager_status = True

            full_name = f"{user.first_name} {user.last_name}".strip()
            if not full_name:
                full_name = user.username

            return Response({
                "token": token.key,
                "user_id": user.pk,
                "employee_id": employee_id,
                "username": user.username,
                "first_name": user.first_name, 
                "last_name": user.last_name,  
                "full_name": full_name,
                "designation": designation,
                "role": portal_role,             
                "is_manager": is_manager_status,
                "department": department_name,   
                "avatar": avatar
            })
        else:
            return Response({"error": "Invalid Credentials"}, status=400)


# --- 5. SETTINGS VIEWS ---
class EmployeeProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmployeeProfileSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_object(self):
        return get_object_or_404(Employee, user=self.request.user)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if user.check_password(serializer.data.get('old_password')):
                user.set_password(serializer.data.get('new_password'))
                user.save()
                return Response({"message": "Password changed successfully"}, status=200)
            return Response({"error": "Incorrect old password"}, status=400)
        return Response(serializer.errors, status=400)
    
    
# --- Custom Pagination Class ---
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10 # Number of employees per page
    page_size_query_param = 'page_size'
    max_page_size = 100
    
# --- EMPLOYEE OVERVIEW LIST API ---
class ManagerEmployeeOverview(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Security Check: Ensure user is a manager or superuser
        is_superuser = request.user.is_superuser
        is_manager = False
        if hasattr(request.user, 'employee'):
            emp = request.user.employee
            if (emp.role and emp.role.lower() == 'manager') or getattr(emp, 'is_manager', False):
                is_manager = True

        if not (is_superuser or is_manager):
            return Response({"error": "Forbidden. Managers only."}, status=403)

        # 2. Base Queryset (Optimized with select_related/prefetch_related to prevent N+1 queries)
        queryset = Employee.objects.select_related('user', 'reports_to__user').prefetch_related('projects').all()

        # 3. Apply Filters
        search_query = request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(user__email__icontains=search_query)
            )

        status_filter = request.query_params.get('status', 'All')
        if status_filter and status_filter.lower() != 'all':
            queryset = queryset.filter(status__iexact=status_filter)

        project_filter = request.query_params.get('project', 'All Projects')
        if project_filter and project_filter.lower() != 'all projects':
            # Assuming frontend sends the project name in the dropdown
            queryset = queryset.filter(projects__name__iexact=project_filter)

        # Order by newest first, or alphabetically
        queryset = queryset.order_by('-date_joined')
        
        # Get total count for the header ("Total Count of all employees")
        total_count = queryset.count()

        # 4. Apply Pagination
        paginator = StandardResultsSetPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request, view=self)
        
        serializer = EmployeeOverviewSerializer(paginated_queryset, many=True)

        # Return paginated response along with our custom total_count
        return paginator.get_paginated_response({
            'total_count': total_count,
            'employees': serializer.data
        })