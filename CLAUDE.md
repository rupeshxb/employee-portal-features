# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Employee portal for HR & project management. Employees submit daily tasks; managers track team performance; admins manage org structure (employees, projects, designations, tags, departments).

## Commands

### Frontend (run from `frontend/`)

```bash
npm install          # Install dependencies
npm run dev          # Dev server on port 5173 (proxies /api/* to :8000)
npm run build        # Production build
npm run lint         # ESLint
```

### Backend (run from `backend/`)

```bash
python manage.py runserver       # Dev server on port 8000
python manage.py migrate         # Apply migrations
python manage.py makemigrations  # Create new migrations
python manage.py seed_db         # Seed dev database
python manage.py test employee_portal.tests  # Run backend tests
```

## Architecture

### Stack

- **Frontend:** React 19 + Vite 7, React Router 7, axios, CSS Modules
- **Backend:** Django 6 + Django REST Framework 3.16, Token authentication
- **Database:** PostgreSQL (via `dj-database-url`)
- **Media:** Cloudinary (employee avatars)
- **API Docs:** drf-spectacular at `/api/docs/swagger/` and `/api/docs/redoc/`

### Frontend → Backend Communication

- `axiosInstance` (`frontend/src/utils/axiosInstance.js`) attaches `Authorization: Token <token>` to every request
- Token is stored in `localStorage` and managed via `UserContext` (`frontend/src/context/UserContext.jsx`)
- Vite dev proxy forwards `/api/*` to `http://127.0.0.1:8000`; the API base URL is set via `VITE_API_URL`

### Key Django Models (`backend/employee_portal/models.py`)

- **Employee** — OneToOne with Django `User`; has `role`, `department`, `designation`, `projects`, avatar
- **Department** — organizational grouping
- **Designation** — job titles with ManyToMany to `Tag`; has `status` field
- **Tag** — skill/role labels used for grouping employees
- **Project** — assigned employees, color, timeline
- **DailySubmission** — per-employee per-day record (meeting count)
- **DailyTask** — individual tasks under a submission (content, blocker flag)

### Backend URL Structure (`backend/employee_portal/urls.py`)

All API endpoints are prefixed with `/api/`. Login at `POST /api/login/`, logout at `POST /api/logout/`. ViewSets use DRF routers.

### Frontend Route Structure (`frontend/src/App.jsx`)

Role-based routing:
- **Employee:** `/employee/dashboard`, `/employee/team-updates`
- **Manager:** `/manager/dashboard`, `/manager/daily-tasks`, `/manager/employee-overview`, `/manager/projects-overview`, `/manager/tags`, `/manager/designations`
- **Shared:** `/settings`

### Role Checks

Frontend gates manager views using `user.is_manager` or `user.role` from `UserContext`. Backend enforces the same via DRF permission classes on viewsets.

## Environment

### Backend (`backend/.env`)

```
SECRET_KEY=
DATABASE_URL=postgresql://postgres:root@localhost:5432/hamro_salary_db
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Frontend

- Dev: `frontend/env.development` — `VITE_API_URL=http://127.0.0.1:8000`
- Prod: `frontend/env.production` — `VITE_API_URL=https://employee-portal-r59t.onrender.com`

## Deployment

- Backend: Render (`gunicorn core.wsgi` via `Procfile`)
- Frontend: Vercel
- Static files: WhiteNoise middleware
- `CORS_ALLOW_ALL_ORIGINS = True` in settings (restrict in production if tightening security)
