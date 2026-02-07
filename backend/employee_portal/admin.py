from django.contrib import admin
from .models import Project, Employee, DailyTask

admin.site.register(Project)
admin.site.register(Employee)
admin.site.register(DailyTask)