from django.contrib import admin
from .models import Project, Employee, DailyTask

# This tells Django: "Show these tables in the Admin Dashboard"
admin.site.register(Project)
admin.site.register(Employee)
admin.site.register(DailyTask)