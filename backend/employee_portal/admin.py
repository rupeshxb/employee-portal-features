from django.contrib import admin
from django.contrib.auth.models import User
from django import forms
from django.utils.html import format_html
# ADDED: Imported Department here
from .models import Project, Employee, DailyTask, Department

# --- 1. CUSTOM FORM FOR PROJECT ---
class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = '__all__'
        widgets = {
            'color_code': forms.RadioSelect,
        }

# --- 2. PROJECT ADMIN ---
class ProjectAdmin(admin.ModelAdmin):
    form = ProjectForm
    
    list_display = ('name', 'color_display', 'status')
    search_fields = ('name',)
    list_filter = ('status',)

    class Media:
        js = ('admin_colors.js',) 

    def color_display(self, obj):
        return format_html(
            '<span style="background-color: {}; color: #fff; padding: 5px 10px; border-radius: 15px; font-weight: bold; text-shadow: 0px 0px 3px #000;">{}</span>',
            obj.color_code,              
            obj.get_color_code_display() 
        )
    color_display.short_description = 'Project Color'

admin.site.register(Project, ProjectAdmin)

# --- 3. DEPARTMENT ADMIN (NEW) ---
# ADDED: This creates the Department section in the admin panel
@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)


# --- 4. DAILY TASK ADMIN ---
admin.site.register(DailyTask)


# --- 5. CUSTOM FORM FOR EMPLOYEE CREATION ---
class EmployeeCreationForm(forms.ModelForm):
    username = forms.CharField(label="Username")
    password = forms.CharField(widget=forms.PasswordInput, label="Password")
    first_name = forms.CharField(label="First Name")
    last_name = forms.CharField(label="Last Name")
    email = forms.EmailField(label="Email Address", required=False)

    class Meta:
        model = Employee
        exclude = ['user'] 
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'designation', 'department', 'is_manager']

    def save(self, commit=True):
        user = User.objects.create_user(
            username=self.cleaned_data['username'],
            password=self.cleaned_data['password'],
            first_name=self.cleaned_data['first_name'],
            last_name=self.cleaned_data['last_name'],
            email=self.cleaned_data['email']
        )
        employee = super().save(commit=False)
        employee.user = user
        if commit:
            employee.save()
        return employee

# --- 6. EMPLOYEE ADMIN CONFIG ---
@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('get_username', 'designation', 'department', 'is_manager')
    search_fields = ('user__username', 'user__first_name')
    list_filter = ('is_manager', 'department')

    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            return EmployeeCreationForm
        return super().get_form(request, obj, **kwargs)

    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Username'