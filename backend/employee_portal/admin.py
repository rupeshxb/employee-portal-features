from django.contrib import admin
from django.contrib.auth.models import User
from django import forms
from .models import Project, Employee, DailyTask

# --- 1. PROJECT & TASK ADMIN (Standard) ---
admin.site.register(Project)
admin.site.register(DailyTask)

# --- 2. CUSTOM FORM FOR EMPLOYEE CREATION ---
class EmployeeCreationForm(forms.ModelForm):
    # Add standard User fields to the form
    username = forms.CharField(label="Username")
    password = forms.CharField(widget=forms.PasswordInput, label="Password")
    first_name = forms.CharField(label="First Name")
    last_name = forms.CharField(label="Last Name")
    email = forms.EmailField(label="Email Address", required=False)

    class Meta:
        model = Employee
        # We exclude 'user' because we will create it programmatically
        exclude = ['user'] 
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'designation', 'department']

    def save(self, commit=True):
        # 1. Create the User Object first
        user = User.objects.create_user(
            username=self.cleaned_data['username'],
            password=self.cleaned_data['password'],
            first_name=self.cleaned_data['first_name'],
            last_name=self.cleaned_data['last_name'],
            email=self.cleaned_data['email']
        )
        
        # 2. Create the Employee Object linked to that User
        employee = super().save(commit=False)
        employee.user = user
        
        if commit:
            employee.save()
        return employee

# --- 3. EMPLOYEE ADMIN CONFIG ---
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('get_username', 'designation', 'department')
    search_fields = ('user__username', 'user__first_name')

    # This function swaps the form: 
    # If adding new -> Use Custom Form (with password/name fields)
    # If editing -> Use Standard Form (readonly user)
    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            return EmployeeCreationForm
        return super().get_form(request, obj, **kwargs)

    # Helper to show username in the list view
    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Username'

admin.site.register(Employee, EmployeeAdmin)