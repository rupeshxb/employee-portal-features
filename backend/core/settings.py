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
# False if running on Render, True otherwise
DEBUG = 'RENDER' not in os.environ

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
    # Cloudinary Apps (Order matters: cloudinary_storage first)
    'cloudinary_storage',
    'django.contrib.staticfiles', # staticfiles must be here
    'cloudinary',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',         # <--- MUST BE TOP
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',    # <--- REQUIRED FOR OPTION A
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

STATIC_URL = '/static/'

# 1. Where to collect files for production (Render)
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

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

# 5. MODERN STORAGE CONFIGURATION (Django 4.2+)
STORAGES = {
    # Media files (Images) -> Cloudinary
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    },
    # Static files (CSS/JS) -> WhiteNoise
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

# 6. LEGACY STORAGE FALLBACK (CRITICAL FIX)
# The Cloudinary library still looks for these old variables during build.
# We define them to match the STORAGES config above.
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
# This tells Whitenoise: "If a file referenced in CSS is missing, don't crash, just ignore it."
WHITENOISE_MANIFEST_STRICT = False

# --- CORS CONFIGURATION ---

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