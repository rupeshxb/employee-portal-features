from datetime import date, timedelta
from django.db.models import Q, Prefetch
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate

from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination

# Local Imports
from .models import (
    DailyTask, Employee, Project, Department, DailySubmission,
    Designation, Tag  # <-- NEW: Added Designation and Tag
)
from .serializers import (
    DailyTaskSerializer, 
    ProjectSerializer, 
    TeamUpdateEmployeeSerializer,
    ChangePasswordSerializer, 
    EmployeeProfileSerializer,
    DepartmentSerializer,
    EmployeeSerializer,
    ManagerDailySubmissionSerializer,
    EmployeeOverviewSerializer,
    EmployeeDetailSerializer,
    ManagerDropdownSerializer, 
    EmployeeCreateSerializer,
    DesignationSerializer,  # <-- NEW
    TagSerializer           # <-- NEW
)


# --- EMPLOYEE DAILY SUBMISSION ENDPOINT ---
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


# --- DEPARTMENT LIST VIEW ---
class DepartmentListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        departments = Department.objects.all().order_by('name')
        return Response(DepartmentSerializer(departments, many=True).data)


# --- EMPLOYEE LIST VIEW ---
class EmployeeListView(generics.ListAPIView):
    queryset = Employee.objects.select_related('user', 'department').all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]


# --- DAILY TASK VIEWS ---
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


# --- TEAM UPDATES VIEW (STANDARD EMPLOYEES) ---
@api_view(['GET'])
def team_updates(request):
    date_param = request.GET.get('date')
    filter_type = request.GET.get('filter_type', '')  # 'today', 'yesterday', 'custom', or ''
    search_query = request.GET.get('search', '')
    project_filter = request.GET.get('project', 'All Projects')
    role_filter = request.GET.get('role', 'All Roles')

    # Trust the client's date (it sends LOCAL date matching how DailyTask.date is stored)
    target_date = parse_date(date_param) if date_param else date.today()
    if not target_date:
        target_date = date.today()

    prev_date = target_date - timedelta(days=1)
    show_prev_day = filter_type != 'custom'
    show_previous = not filter_type  # only for the "All" (no filter) case

    employees = Employee.objects.select_related('user').all()

    if search_query:
        employees = employees.filter(
            Q(user__username__icontains=search_query) |
            Q(user__first_name__icontains=search_query) |
            Q(user__last_name__icontains=search_query)
        )

    if role_filter != 'All Roles':
        employees = employees.filter(designation__name__iexact=role_filter)

    response_data = []

    for emp in employees:
        tasks_query = DailyTask.objects.filter(employee=emp)

        if project_filter != 'All Projects':
            tasks_query = tasks_query.filter(project__name=project_filter)

        today_tasks = tasks_query.filter(date=target_date, is_blocker=False)
        blockers = tasks_query.filter(date=target_date, is_blocker=True)
        has_target_activity = today_tasks.exists() or blockers.exists()

        if filter_type:
            # Specific date selected: prev day only shown if target date is active
            if not has_target_activity:
                continue
            yesterday_tasks = tasks_query.filter(date=prev_date, is_blocker=False) if show_prev_day else DailyTask.objects.none()
            previous_tasks = DailyTask.objects.none()
        else:
            # "All" filter: show any historical activity, no anchor restriction
            yesterday_tasks = tasks_query.filter(date=prev_date, is_blocker=False)
            previous_tasks = tasks_query.filter(date__lt=prev_date, is_blocker=False)
            if not has_target_activity and not yesterday_tasks.exists() and not previous_tasks.exists():
                continue

        emp_data = TeamUpdateEmployeeSerializer(emp).data
        emp_data['tasks'] = {
            'today': DailyTaskSerializer(today_tasks, many=True).data,
            'yesterday': DailyTaskSerializer(yesterday_tasks, many=True).data,
            'blockers': DailyTaskSerializer(blockers, many=True).data,
            'previous': DailyTaskSerializer(previous_tasks, many=True).data,
        }
        response_data.append(emp_data)

    return Response({
        'meta': {
            'target_date': str(target_date),
            'prev_date': str(prev_date),
            'filter_type': filter_type,
        },
        'employees': response_data,
    })


# --- MANAGER TEAM UPDATES VIEW ---
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
        date_str = request.query_params.get('date', '').strip()
        filter_type = request.query_params.get('filter_type', '')  # 'today', 'yesterday', 'custom'

        # Trust the client's date (it sends LOCAL date matching how DailyTask.date is stored)
        target_date = parse_date(date_str) if date_str else timezone.now().date()
        if not target_date:
            target_date = timezone.now().date()

        prev_date = target_date - timedelta(days=1)
        show_prev_day = filter_type != 'custom'

        # Filters
        tag_filter = request.query_params.get('tag', 'all')
        time_filter = request.query_params.get('time', 'Time')
        search_query = request.query_params.get('search', '')
        project_filter = request.query_params.get('project', 'All Projects')

        # Scope prefetch to only the dates we care about — old tasks cannot leak through
        relevant_dates = [target_date, prev_date] if show_prev_day else [target_date]
        tasks_qs = DailyTask.objects.select_related('project').filter(
            date__in=relevant_dates
        ).order_by('-date', '-created_at')
        if project_filter != 'All Projects':
            tasks_qs = tasks_qs.filter(project__name__iexact=project_filter)

        submissions_qs = DailySubmission.objects.filter(date=target_date)

        employees = Employee.objects.select_related('user').filter(role='Employee', is_manager=False)

        employees = employees.prefetch_related(
            Prefetch('dailytask_set', queryset=tasks_qs, to_attr='prefetched_tasks'),
            Prefetch('daily_submissions', queryset=submissions_qs, to_attr='prefetched_target_submissions')
        )

        if tag_filter and str(tag_filter).lower() != 'all':
            try:
                tag_id = int(tag_filter)
                employees = employees.filter(designation__tags__id=tag_id).distinct()
            except (ValueError, TypeError):
                pass

        total_in_department = employees.count()

        if search_query:
            employees = employees.filter(
                Q(user__username__icontains=search_query) | 
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query)
            )

        formatted_employees = []

        for emp in employees:
            submission = emp.prefetched_target_submissions[0] if emp.prefetched_target_submissions else None
            emp_tasks = emp.prefetched_tasks
            
            latest_task = next((t for t in emp_tasks if t.date == target_date), None)
            
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

            today_tasks, prev_day_tasks, blockers = [], [], []

            for t in emp_tasks:
                if t.date == target_date:
                    if t.is_blocker:
                        blockers.append(t)
                    else:
                        today_tasks.append(t)
                elif t.date == prev_date and show_prev_day and not t.is_blocker:
                    prev_day_tasks.append(t)

            # Only show prev-day tasks if target date had a submission
            yesterday_tasks = prev_day_tasks if (today_tasks or blockers) else []

            submitted_time_iso = actual_submit_time.isoformat() if actual_submit_time else None

            emp_data = TeamUpdateEmployeeSerializer(emp).data
            emp_data['submittedTime'] = submitted_time_iso
            emp_data['meetings'] = submission.meeting_count if submission else 0
            emp_data['blockers'] = len(blockers)
            
            emp_data['tasks'] = {
                'today': DailyTaskSerializer(today_tasks, many=True).data,
                'yesterday': DailyTaskSerializer(yesterday_tasks, many=True).data,
                'blockers': DailyTaskSerializer(blockers, many=True).data,
            }
            
            formatted_employees.append({
                "sort_time": actual_submit_time,
                "data": emp_data
            })
            
        def sort_by_latest(item):
            t = item['sort_time']
            if t is None:
                return (0, 0)
            return (1, t.timestamp())

        formatted_employees.sort(key=sort_by_latest, reverse=True)
        final_employees_list = [item['data'] for item in formatted_employees]

        return Response({
            "total_in_department": total_in_department,
            "meta": {
                "target_date": str(target_date),
                "prev_date": str(prev_date),
                "filter_type": filter_type,
            },
            "employees": final_employees_list,
        })


# --- AUTHENTICATION VIEWS ---
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
                designation = employee.designation.name if employee.designation else None
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
                "designation_name": designation,
                "role": portal_role,
                "is_manager": is_manager_status,
                "department": department_name,
                "avatar": avatar
            })
        else:
            return Response({"error": "Invalid Credentials"}, status=400)


# --- SETTINGS VIEWS ---
class EmployeeProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmployeeProfileSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_object(self):
        return get_object_or_404(Employee, user=self.request.user)


class RemoveAvatarView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        employee = get_object_or_404(Employee, user=request.user)
        if employee.avatar:
            employee.avatar.delete(save=False)
        employee.avatar = None
        employee.save()
        return Response({'avatar': None}, status=200)


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
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    

# --- EMPLOYEE OVERVIEW LIST API ---
class ManagerEmployeeOverview(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_superuser = request.user.is_superuser
        is_manager = False
        if hasattr(request.user, 'employee'):
            emp = request.user.employee
            if (emp.role and emp.role.lower() == 'manager') or getattr(emp, 'is_manager', False):
                is_manager = True

        if not (is_superuser or is_manager):
            return Response({"error": "Forbidden. Managers only."}, status=403)

        queryset = Employee.objects.select_related('user', 'reports_to__user').prefetch_related('projects').all()

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
            queryset = queryset.filter(projects__name__iexact=project_filter)

        queryset = queryset.order_by('-date_joined')
        
        total_count = queryset.count()

        paginator = StandardResultsSetPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request, view=self)
        
        serializer = EmployeeOverviewSerializer(paginated_queryset, many=True, context={'request': request})

        return paginator.get_paginated_response({
            'total_count': total_count,
            'employees': serializer.data
        })
        
    def post(self, request):
        is_superuser = request.user.is_superuser
        is_manager = False
        if hasattr(request.user, 'employee'):
            emp = request.user.employee
            if (emp.role and emp.role.lower() == 'manager') or getattr(emp, 'is_manager', False):
                is_manager = True

        if not (is_superuser or is_manager):
            return Response({"error": "Forbidden. Managers only."}, status=403)

        serializer = EmployeeCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Employee created successfully!", "data": serializer.data}, status=201)
        
        return Response(serializer.errors, status=400)
    

# --- EMPLOYEE DETAIL API ---
class ManagerEmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.select_related('user', 'department', 'reports_to__user').all()
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def check_permissions(self, request):
        super().check_permissions(request)
        is_superuser = request.user.is_superuser
        is_manager = False
        
        if hasattr(request.user, 'employee'):
            emp = request.user.employee
            if (emp.role and emp.role.lower() == 'manager') or getattr(emp, 'is_manager', False):
                is_manager = True

        if not (is_superuser or is_manager):
            self.permission_denied(request, message="Forbidden. Managers only.")


# --- PROJECT OVERVIEW VIEWS ---
class ProjectList(generics.ListCreateAPIView):
    """Handles GET (list all) and POST (create new) for Projects"""
    queryset = Project.objects.all().order_by('-id')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    """Handles GET (read one), PUT/PATCH (update), and DELETE for a single Project"""
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]


# --- MANAGER DROPDOWN VIEW ---
class ManagerListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ManagerDropdownSerializer
    pagination_class = None 

    def get_queryset(self):
        return Employee.objects.select_related('user').filter(
            Q(is_manager=True) | Q(role='Manager')
        )
    

# --- EMPLOYEE DETAIL / DELETE VIEW ---
class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.select_related('user', 'department', 'reports_to').all()
    serializer_class = EmployeeDetailSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        # Deleting the User cascades to the Employee via OneToOneField(on_delete=CASCADE),
        # so we only need to delete the user — deleting the employee first then calling
        # user.delete() works too but is redundant.
        user = instance.user
        user.delete()


# ==========================================
# --- NEW: DESIGNATION & TAG VIEWS ---
# ==========================================

class DesignationListCreateView(generics.ListCreateAPIView):
    """
    GET: list all designations (pagination disabled for dropdown usage).
    POST: create a new designation.
    """
    queryset = Designation.objects.all().order_by('name')
    serializer_class = DesignationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class DesignationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE a single designation by pk.
    """
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    permission_classes = [IsAuthenticated]

class TagListCreateView(generics.ListCreateAPIView):
    """
    Handles GET (list all tags) and POST (create a new tag).
    Uses prefetch_related to grab the M2M designations efficiently.
    """
    queryset = Tag.objects.prefetch_related('designations').all().order_by('-id')
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None 

class TagDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles GET (single tag detail), PUT/PATCH (update tag), and DELETE (remove tag).
    """
    queryset = Tag.objects.prefetch_related('designations').all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]