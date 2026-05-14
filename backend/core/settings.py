"""
Django settings for core project.
Production-ready configuration for Render.com and Local Development.
"""

import os
import dj_database_url
from pathlib import Path
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --- SECURITY CONFIGURATION ---

# 2. SECRET KEY
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-fallback-key-for-dev')

# 3. DEBUG MODE
# This looks for your manual DEBUG variable. If not found, it defaults to False.
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# 4. ALLOWED HOSTS
ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'employee_portal',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'cloudinary_storage',
    'cloudinary',
    'drf_spectacular', # <--- Swagger API generator
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',         # <--- MUST BE TOP
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',    # <--- Serves the files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# --- DATABASE CONFIGURATION ---

DATABASES = {
    'default': dj_database_url.config(
        # Local DB Connection String (Fallback if DATABASE_URL not in env)
        default='postgresql://postgres:root@localhost:5432/hamro_salary_db',
        conn_max_age=600,
        conn_health_checks=True  # <--- THIS IS THE MAGIC LINE
    )
}


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]


# Internationalization

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# --- STATIC & MEDIA FILES ---

STATIC_URL = '/static/'

# 1. Where to collect files for production (Render)
STATIC_ROOT = os.path.join(str(BASE_DIR), 'staticfiles')

# 2. Where to look for extra static files
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# 3. Media Files (User Uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# 4. Cloudinary Configuration
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
}

# 5. STORAGE CONFIGURATION (NO COMPRESSION)
# This uses standard storage for static files to bypass the Whitenoise compression crash.
# Local dev opt-in: set USE_LOCAL_MEDIA=true in backend/.env to write media to
# MEDIA_ROOT instead of Cloudinary (keeps the shared Cloudinary account clean).
USE_LOCAL_MEDIA = os.environ.get('USE_LOCAL_MEDIA', '').lower() in ('1', 'true', 'yes')

_MEDIA_BACKEND = (
    'django.core.files.storage.FileSystemStorage'
    if USE_LOCAL_MEDIA
    else 'cloudinary_storage.storage.MediaCloudinaryStorage'
)

STORAGES = {
    "default": {
        "BACKEND": _MEDIA_BACKEND,
    },
    # Static files (CSS/JS) -> Standard Django Storage (No Compression)
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

# 6. LEGACY FALLBACK (Must match above)
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
DEFAULT_FILE_STORAGE = _MEDIA_BACKEND


# --- CORS CONFIGURATION ---

CORS_ALLOW_ALL_ORIGINS = True 

# --- DRF CONFIGURATION ---

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# --- SWAGGER / SPECTACULAR CONFIGURATION (HANDOVER DOCS) ---

SPECTACULAR_SETTINGS = {
    'TITLE': 'HR & Project Management API',
    'DESCRIPTION': (
        'Official API documentation for the HR, Employee, and Project management system.\n\n'
        '### Handover Notes\n'
        '* **Completed Modules:** Employee Management, Project Creation, Team Structure, Authentication.\n'
        '* **Pending Modules (To be implemented):** Salary calculations, Bulk Salary generation.\n\n'
        'All endpoints currently require Token Authentication via the `Authorization: Token <your_token>` header.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'CONTACT': {
        'name': 'Rupesh Bhatta',
        'email': 'rupesh.bhatta1234@gmail.com', 
    },
    'COMPONENT_SPLIT_REQUEST': True, # Makes request/response schemas cleaner in UI
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True, # Keeps the user logged in across page refreshes in Swagger UI
        'displayOperationId': True,
    },
}

#--- LOGGING CONFIGURATION FOR PRODUCTION ---
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}