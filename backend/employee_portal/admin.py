from django.contrib import admin
from django.contrib.auth.models import User
from django import forms
from django.utils.html import format_html
from .models import Project, Employee, DailyTask

# --- 1. CUSTOM FORM FOR PROJECT ---
class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = '__all__'
        # CHANGE: Use RadioSelect to show all colors at once
        widgets = {
            'color_code': forms.RadioSelect,
        }

# --- 2. PROJECT ADMIN (UPDATED) ---
class ProjectAdmin(admin.ModelAdmin):
    form = ProjectForm
    
    list_display = ('name', 'color_display', 'status')
    search_fields = ('name',)
    list_filter = ('status',)

    # INJECT JAVASCRIPT: This loads your static/admin_colors.js file
    class Media:
        js = ('admin_colors.js',) 

    # List View Color Preview
    def color_display(self, obj):
        return format_html(
            '<span style="background-color: {}; color: #fff; padding: 5px 10px; border-radius: 15px; font-weight: bold; text-shadow: 0px 0px 3px #000;">{}</span>',
            obj.color_code,              
            obj.get_color_code_display() 
        )
    color_display.short_description = 'Project Color'

admin.site.register(Project, ProjectAdmin)


# --- 3. DAILY TASK ADMIN (Standard) ---
admin.site.register(DailyTask)


# --- 4. CUSTOM FORM FOR EMPLOYEE CREATION (Kept same) ---
class EmployeeCreationForm(forms.ModelForm):
    username = forms.CharField(label="Username")
    password = forms.CharField(widget=forms.PasswordInput, label="Password")
    first_name = forms.CharField(label="First Name")
    last_name = forms.CharField(label="Last Name")
    email = forms.EmailField(label="Email Address", required=False)

    class Meta:
        model = Employee
        exclude = ['user'] 
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'designation', 'department']

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

# --- 5. EMPLOYEE ADMIN CONFIG (Kept same) ---
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('get_username', 'designation', 'department')
    search_fields = ('user__username', 'user__first_name')

    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            return EmployeeCreationForm
        return super().get_form(request, obj, **kwargs)

    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Username'

admin.site.register(Employee, EmployeeAdmin)