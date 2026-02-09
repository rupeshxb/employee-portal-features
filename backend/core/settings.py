"""
Django settings for core project.
Production-ready configuration for Render.com and Local Development.
"""

import os
import dj_database_url
from pathlib import Path
from dotenv import load_dotenv

# 1. Load Environment Variables
# This loads variables from a .env file locally, but does nothing on Render
# (because Render sets them in the dashboard).
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --- SECURITY CONFIGURATION ---

# 2. SECRET KEY
# In Production (Render): It pulls from the environment variable.
# In Local: It falls back to the insecure key (convenient for dev).
SECRET_KEY = os.environ.get('SECRET_KEY')

if not SECRET_KEY:
    raise ValueError("No SECRET_KEY set for Django application")

# 3. DEBUG MODE
# We check if we are on Render. If yes, DEBUG is False (Secure).
# If no (Local), DEBUG is True (Helpful errors).
DEBUG = 'RENDER' not in os.environ

# 4. ALLOWED HOSTS
# '*' allows all domains. This is necessary because Render gives dynamic URLs.
# In a strict enterprise app, you would list specific domains here.
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
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',         # <--- MUST BE TOP (for React)
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',    # <--- NEW: Serves static files on Render
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

# 5. DYNAMIC DATABASE SWITCHING
# This logic checks: Is there a DATABASE_URL in the environment?
# If YES (Render/Neon): Use that Cloud Database.
# If NO (Local): Use your local PostgreSQL credentials.

DATABASES = {
    'default': dj_database_url.config(
        # This is your Local DB Connection String
        default='postgresql://postgres:root@localhost:5432/hamro_salary_db',
        conn_max_age=600
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

# 6. STATIC FILES (CSS, JS, Images for Admin Panel)
STATIC_URL = 'static/'
# This determines where static files are collected when you run 'collectstatic'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
# WhiteNoise enables Python to serve its own static files (crucial for Render)
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# 7. MEDIA FILES (User Uploaded Avatars)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# NOTE ON MEDIA FILES IN RENDER FREE TIER:
# Render's free disk is "ephemeral". If the server restarts (which happens often),
# uploaded images will vanish. For a portfolio demo, this is usually acceptable.
# For a real product, you would use AWS S3.


# --- CORS CONFIGURATION ---

# 8. CORS
# Allows your React frontend to communicate with this Backend.
CORS_ALLOW_ALL_ORIGINS = True 


# --- DRF CONFIGURATION ---

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}