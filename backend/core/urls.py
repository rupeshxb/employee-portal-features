from django.contrib import admin
from django.urls import path, include # <--- Don't forget to import 'include'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('employee_portal.urls')), # <--- This line is critical
]