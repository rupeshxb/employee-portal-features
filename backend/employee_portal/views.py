from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import authenticate
from django.utils.dateparse import parse_date
from datetime import timedelta, date
from django.db.models import Q
from django.shortcuts import get_object_or_404

# Use local imports since we are in the same app
from .models import DailyTask, Employee, Project
from .serializers import (
    DailyTaskSerializer, 
    ProjectSerializer, 
    TeamUpdateEmployeeSerializer,
    ChangePasswordSerializer, 
    EmployeeProfileSerializer
)

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

# --- 3. TEAM UPDATES VIEW ---
@api_view(['GET'])
def team_updates(request):
    date_param = request.GET.get('date')
    search_query = request.GET.get('search', '')
    project_filter = request.GET.get('project', 'All Projects')
    role_filter = request.GET.get('role', 'All Roles')

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

        has_activity = (today_tasks.exists() or yesterday_tasks.exists() or blockers.exists())

        if not has_activity:
            continue 

        emp_data = TeamUpdateEmployeeSerializer(emp).data
        emp_data['tasks'] = {
            'today': DailyTaskSerializer(today_tasks, many=True).data,
            'yesterday': DailyTaskSerializer(yesterday_tasks, many=True).data,
            'blockers': DailyTaskSerializer(blockers, many=True).data
        }
        response_data.append(emp_data)

    return Response(response_data)

# --- 4. AUTHENTICATION VIEWS ---
class CustomLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            employee = getattr(user, 'employee', None)
            
            # Allow login even if not an 'employee' (e.g. admin), but prefer employee data
            role = "User"
            avatar = None
            employee_id = None

            if employee:
                employee_id = employee.pk
                role = employee.designation
                avatar = employee.avatar.url if employee.avatar else None
            elif user.is_superuser:
                role = "Admin"

            # Construct Full Name safely
            full_name = f"{user.first_name} {user.last_name}".strip()
            if not full_name:
                full_name = user.username

            return Response({
                "token": token.key,
                "user_id": user.pk,
                "employee_id": employee_id,
                "username": user.username,
                "first_name": user.first_name, # <-- ADDED THIS
                "last_name": user.last_name,   # <-- ADDED THIS
                "full_name": full_name,
                "role": role,
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