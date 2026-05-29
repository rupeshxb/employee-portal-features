from fpdf import FPDF
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "Employee_Portal_Technical_Documentation.pdf")

SECTIONS = [
    {
        "title": "1. Architecture & Project Structure",
        "content": [
            ("heading", "Folder Layout"),
            ("code", """\
employee-portal-features/
├── backend/                        # Django API server
│   ├── core/
│   │   ├── settings.py             # All configuration
│   │   ├── urls.py                 # Root URL router
│   │   └── wsgi.py
│   ├── employee_portal/
│   │   ├── models.py               # Database models
│   │   ├── serializers.py          # Model <-> JSON conversion
│   │   ├── views.py                # Business logic + HTTP handling
│   │   ├── urls.py                 # App-level route definitions
│   │   ├── migrations/             # DB schema history
│   │   └── tests.py
│   ├── Procfile
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx                 # Root router + role-based layout
        ├── context/UserContext.jsx # Global auth state
        ├── components/             # Page + shared UI components
        └── utils/axiosInstance.js  # Axios singleton with auth header"""),
            ("heading", "Tech Stack"),
            ("table", [
                ["Layer", "Technology"],
                ["Frontend", "React 19, React Router 7, Axios, Vite 7"],
                ["Backend", "Django 6, Django REST Framework 3.16"],
                ["Database", "PostgreSQL (via dj-database-url)"],
                ["Auth", "DRF Token Authentication"],
                ["Media Storage", "Cloudinary (prod) / local filesystem (dev)"],
                ["Static Files", "WhiteNoise"],
                ["API Docs", "drf-spectacular -> Swagger UI + ReDoc"],
                ["Deployment", "Backend: Render, Frontend: Vercel"],
            ]),
            ("heading", "Architecture Pattern"),
            ("body", "REST API + SPA. Django follows a 3-layer pattern: Request -> View (views.py) -> Serializer (serializers.py) -> Model (models.py) -> PostgreSQL. There is no explicit service layer — business logic lives directly in views, which is appropriate for the current complexity."),
            ("heading", "Data Flow (End to End)"),
            ("code", """\
User action in React
  -> axiosInstance adds Authorization: Token <token> header
  -> Django receives request, TokenAuthentication validates token
  -> View checks permission_classes (IsAuthenticated / role check)
  -> View queries DB via Django ORM
  -> Serializer converts QuerySet -> Python dict -> JSON
  -> Response returned to React
  -> Component renders new state"""),
        ]
    },
    {
        "title": "2. Database Design",
        "content": [
            ("heading", "Tables & Relationships"),
            ("code", """\
User (Django built-in)
 └── OneToOne ──► Employee
                    ├── ForeignKey ──► Department
                    ├── ForeignKey ──► Designation ──► ManyToMany ──► Tag
                    ├── ForeignKey ──► Employee (self, reports_to)
                    ├── ManyToMany ──► Project
                    ├── OneToMany ──► DailySubmission
                    └── OneToMany ──► DailyTask

DailySubmission
 └── OneToMany ──► DailyTask"""),
            ("heading", "Key Table Definitions"),
            ("body", "Department: id (PK), name (unique, max 100), created_at (auto)"),
            ("body", "Designation: id (PK), name (unique), system_name (unique slug), description, status (Active/Inactive), created_at"),
            ("body", "Tag: id (PK), display_name (unique), system_name (unique), description, color (hex), status, designations (M2M -> Designation)"),
            ("body", "Project: id (PK), name, client_name, acronym, description, color_code (default #3366ff), start_date, end_date, status"),
            ("body", "Employee: id (PK), user (OneToOne -> User, CASCADE), employee_id (unique), employment_type, personal_email, pan_number, emergency_contact, joined_date, designation (FK, SET_NULL), department (FK, SET_NULL), reports_to (FK -> self, SET_NULL), projects (M2M), role (Employee/Manager), is_manager, status, phone_number, avatar, date_joined"),
            ("body", "DailySubmission: id (PK), employee (FK, CASCADE), date, submitted_at (auto_now), meeting_count. unique_together: (employee, date) — one submission per employee per day."),
            ("body", "DailyTask: id (PK), employee (FK, CASCADE), project (FK, CASCADE), submission (FK, nullable), content, is_blocker, date, created_at, updated_at"),
            ("heading", "Why PostgreSQL?"),
            ("body", "Relational integrity is essential: the FK chain (User -> Employee -> DailyTask) would be cumbersome in NoSQL. unique_together on (employee, date) in DailySubmission enforces the one-submission-per-day rule at the DB level. dj-database-url lets the same codebase connect to local Postgres in dev and Render's managed Postgres in production by changing one env variable."),
            ("heading", "Migrations"),
            ("code", """\
# Create migration files from model changes
python manage.py makemigrations

# Apply pending migrations
python manage.py migrate

# Roll back one step
python manage.py migrate employee_portal 0010

# Roll back to empty DB
python manage.py migrate employee_portal zero"""),
            ("body", "There are currently 11 migrations tracked under backend/employee_portal/migrations/. Django records which have been applied in the django_migrations table."),
            ("heading", "Notable ORM Queries"),
            ("code", """\
# N+1 prevention — ManagerTeamUpdatesView
Employee.objects.select_related('user').prefetch_related(
    Prefetch('dailytask_set', queryset=tasks_qs, to_attr='prefetched_tasks'),
    Prefetch('daily_submissions', queryset=submissions_qs,
             to_attr='prefetched_target_submissions')
)

# Pagination — StandardResultsSetPagination (page_size=10, max=100)
paginator.paginate_queryset(queryset, request)

# Search with OR filters
Employee.objects.filter(
    Q(user__first_name__icontains=search) |
    Q(user__last_name__icontains=search) |
    Q(user__email__icontains=search)
)"""),
        ]
    },
    {
        "title": "3. API / Backend Knowledge",
        "content": [
            ("heading", "All Endpoints  (base prefix: /api/)"),
            ("table", [
                ["Method", "Route", "Auth", "Purpose"],
                ["POST", "login/", "None", "Returns token + user info"],
                ["GET", "profile/", "Token", "Get own employee profile"],
                ["PUT/PATCH", "profile/", "Token", "Update own name/email/avatar"],
                ["DELETE", "profile/avatar/", "Token", "Remove own avatar"],
                ["POST", "change-password/", "Token", "Change own password"],
                ["GET", "tasks/", "Token", "List own daily tasks"],
                ["POST", "tasks/", "Token", "Create a new daily task"],
                ["GET/PUT/PATCH/DELETE", "tasks/<id>/", "Token", "CRUD one task"],
                ["POST", "tasks/submit/", "Token", "Wrap tasks into DailySubmission"],
                ["GET", "projects/", "Token", "List all projects"],
                ["POST", "projects/", "Token", "Create a project"],
                ["GET/PUT/PATCH/DELETE", "projects/<id>/", "Token", "CRUD one project"],
                ["GET", "departments/", "Token", "List all departments"],
                ["GET", "employees/", "Token", "List all employees"],
                ["GET", "employee/team-updates/", "Token", "Employee view: team task activity"],
                ["GET", "manager/team-updates/", "Token+Manager", "Manager view: team task activity"],
                ["GET", "manager/employee-overview/", "Token+Manager", "Paginated employee list"],
                ["POST", "manager/employee-overview/", "Token+Manager", "Create a new employee"],
                ["GET", "manager/managers-list/", "Token", "Dropdown list of all managers"],
                ["GET/PUT/PATCH/DELETE", "manager/employees/<id>/", "Token", "CRUD one employee"],
                ["GET/POST", "designations/", "Token", "List or create designations"],
                ["GET/PUT/PATCH/DELETE", "designations/<id>/", "Token", "CRUD one designation"],
                ["GET/POST", "tags/", "Token", "List or create tags"],
                ["GET/PUT/PATCH/DELETE", "tags/<id>/", "Token", "CRUD one tag"],
                ["GET", "api/schema/", "None (public)", "Raw OpenAPI JSON schema"],
                ["GET", "api/docs/swagger/", "None (public)", "Interactive Swagger UI"],
                ["GET", "api/docs/redoc/", "None (public)", "ReDoc documentation"],
            ]),
            ("heading", "HTTP Status Codes"),
            ("table", [
                ["Code", "When Used"],
                ["200", "Successful GET, PATCH, or re-submission of daily tasks"],
                ["201", "Successful POST (resource created)"],
                ["400", "Validation failure, wrong old password, bad meeting_count"],
                ["403", "Authenticated but wrong role (Employee hitting Manager endpoint)"],
                ["404", "get_object_or_404 — record does not exist"],
                ["401", "Token missing or invalid (DRF default)"],
                ["500", "Unhandled server error (logged to console)"],
            ]),
            ("heading", "Input Validation"),
            ("body", "Validation lives primarily in serializers. DRF automatically enforces required fields, type-checks (EmailField, PrimaryKeyRelatedField, PositiveIntegerField), and unique constraints (username, employee_id). Manual validation in views handles edge cases like meeting_count integer coercion."),
            ("heading", "Example: POST /api/login/"),
            ("code", """\
// Request
{ "username": "rupesh", "password": "secret" }

// Response 200
{
  "token": "abc123...",
  "user_id": 1,
  "employee_id": 5,
  "full_name": "Rupesh Bhatta",
  "role": "Manager",
  "is_manager": true,
  "department": "Engineering",
  "avatar": "https://res.cloudinary.com/..."
}"""),
            ("heading", "Example: POST /api/tasks/"),
            ("code", """\
// Request (Authorization: Token abc123)
{
  "content": "Fixed login bug",
  "project_id": 3,
  "is_blocker": false,
  "date": "2026-05-18"
}

// Response 201
{
  "id": 42,
  "content": "Fixed login bug",
  "is_blocker": false,
  "date": "2026-05-18",
  "project_details": { ... }
}"""),
        ]
    },
    {
        "title": "4. Frontend Behavior",
        "content": [
            ("heading", "State Management"),
            ("body", "No Redux or Zustand. Two layers: (1) UserContext (global) — holds the logged-in user object and token, persisted to localStorage, available to every component via useContext(UserContext). (2) Local useState (per component) — each page manages its own data (tasks, employees, filters, loading, errors)."),
            ("heading", "Auth Token Flow"),
            ("code", """\
Login form submitted
  -> POST /api/login/ (no auth header)
  -> Response: { token, user data }
  -> localStorage.setItem('token', token)
  -> localStorage.setItem('user', JSON.stringify(userData))
  -> UserContext.setUser(userData)
  -> React Router redirects to dashboard

Every subsequent request:
  axiosInstance interceptor reads token from localStorage
  and injects Authorization: token <value> automatically"""),
            ("heading", "Form Handling"),
            ("body", "Forms use controlled inputs with local useState. No form library (no Formik, no React Hook Form). Submission calls axios, errors are stored as a string in local state and shown inline. Avatar upload uses react-avatar-editor for crop/resize before upload."),
            ("heading", "Loading & Error States"),
            ("body", "Each data-fetching component tracks: loading boolean (shows spinner or skeleton), error string (shows inline error message), and empty data (shows empty state UI such as 'No tasks submitted yet')."),
        ]
    },
    {
        "title": "5. Authentication & Authorization",
        "content": [
            ("heading", "How Login Works"),
            ("body", "1. POST /api/login/ -> Django's authenticate() validates username + password. 2. Token.objects.get_or_create(user=user) returns a persistent token (one per user, stored in authtoken_token table). 3. Token is returned in the response body and stored in localStorage."),
            ("body", "Note: This is DRF Token auth, NOT JWT. Tokens are stateful — they live in the database and can be invalidated server-side by deleting the token record."),
            ("heading", "Token Storage"),
            ("body", "Stored in localStorage. Trade-off: accessible to JavaScript (XSS risk) but simpler than httpOnly cookies. Acceptable for an internal employee portal. Not recommended for public-facing apps handling financial data."),
            ("heading", "Role-Based Access Control"),
            ("table", [
                ["Feature", "Employee", "Manager", "Superuser"],
                ["Submit daily tasks", "Yes", "Yes", "Yes"],
                ["View team updates (basic)", "Yes", "Yes", "Yes"],
                ["Manager team updates view", "No", "Yes", "Yes"],
                ["Create/edit/delete employees", "No", "Yes", "Yes"],
                ["Manage projects", "No", "Yes", "Yes"],
                ["Manage designations & tags", "No", "Yes", "Yes"],
                ["Django admin panel", "No", "No", "Yes"],
            ]),
            ("heading", "Backend Enforcement (Real Guard)"),
            ("body", "IsAuthenticated on every view rejects requests without a valid token. Manager-only views explicitly check: if not (request.user.is_superuser or is_manager): return Response({'error': 'Forbidden. Managers only.'}, status=403)"),
            ("heading", "Frontend Enforcement (UX Layer)"),
            ("body", "ProtectedRoute wraps route groups and redirects non-managers away from /manager/* routes. Role is derived from: user.is_manager === true || user.role === 'Manager' || user.designation === 'Admin'. This is a UX guard only — the backend always re-validates."),
        ]
    },
    {
        "title": "6. Validation & Business Logic",
        "content": [
            ("heading", "Field Requirements"),
            ("table", [
                ["Model", "Required Fields", "Format Rules"],
                ["Employee (create)", "username, password, first_name, last_name, official_email", "email must be valid format"],
                ["DailyTask", "content, project_id, date", "project_id must exist in DB"],
                ["DailySubmission", "employee, date", "meeting_count must be integer >= 0"],
                ["Designation", "name", "must be unique"],
                ["Tag", "display_name, system_name", "both must be unique"],
            ]),
            ("heading", "Business Rules Enforced"),
            ("body", "One submission per employee per day: enforced by unique_together = ('employee', 'date') on DailySubmission at DB level, and by update_or_create in SubmitDailyTasksView (upserts rather than duplicating)."),
            ("body", "Employees only submit tasks: SubmitDailyTasksView checks hasattr(request.user, 'employee') and returns 403 for superusers without an Employee record."),
            ("body", "Password hashing: User.objects.create_user(password=...) automatically hashes via Django's PBKDF2 hasher. Passwords are never stored in plain text."),
            ("body", "Old password verified before change: ChangePasswordView calls user.check_password(old_password) before user.set_password(new_password)."),
            ("body", "Cascade delete: Deleting an Employee's linked User cascades to remove the Employee and all their tasks/submissions. EmployeeDetailView.perform_destroy deletes instance.user which triggers the cascade."),
            ("heading", "Where Validation Lives"),
            ("body", "Backend serializers (primary) — all data is validated before hitting the database. Backend views (secondary) — for logic that cannot be expressed in serializer field types. Frontend forms (UX only) — basic required field highlights. The backend always re-validates; frontend validation is not trusted as a security boundary."),
        ]
    },
    {
        "title": "7. Testing",
        "content": [
            ("heading", "Current Test Coverage"),
            ("body", "Two unit tests in backend/employee_portal/tests.py:"),
            ("body", "1. test_deleting_employee_deletes_linked_user — verifies CASCADE delete: removing an Employee also removes its linked User."),
            ("body", "2. test_username_can_be_reused_after_employee_delete — verifies the unique username constraint is freed after deletion, so the same username can be registered again without IntegrityError."),
            ("heading", "How to Run"),
            ("code", """\
cd backend
python manage.py test employee_portal.tests"""),
            ("heading", "Coverage Gaps"),
            ("body", "No tests exist for: API endpoint authentication/authorization, serializer validation logic, SubmitDailyTasksView upsert behavior, role-based access (Manager vs Employee), or any frontend behavior (no frontend test suite is configured)."),
        ]
    },
    {
        "title": "8. Error Handling & Edge Cases",
        "content": [
            ("heading", "Backend Error Strategy"),
            ("table", [
                ["Scenario", "Behavior"],
                ["Record not found", "get_object_or_404 -> 404 response"],
                ["Invalid credentials", "authenticate() returns None -> 400 {error: Invalid Credentials}"],
                ["Unauthenticated request", "DRF default -> 401 with detail message"],
                ["Wrong role", "Manual check -> 403 {error: Forbidden. Managers only.}"],
                ["Validation failure", "DRF serializer -> 400 with field-level error dict"],
                ["Invalid meeting_count", "try/except in view -> 400 {error: Meeting count must be integer}"],
                ["Avatar file missing on disk", "get_avatar() catches Exception and returns null"],
                ["Missing User on Manager", "ManagerDropdownSerializer wraps get_full_name in try/except, returns 'Unknown User'"],
            ]),
            ("heading", "Logging"),
            ("body", "Configured in settings.py: WARNING level for root logger (console). INFO for Django framework logs. ERROR for django.request (logs 500s to console/Render logs). No external logging service (e.g., Sentry) is configured."),
            ("heading", "Frontend Error Handling"),
            ("body", "API errors are caught in try/catch blocks and stored in component-level error state. UserContext.fetchUser calls logout() automatically on a 401 response, clearing localStorage and redirecting to /login. No global error boundary is configured."),
        ]
    },
    {
        "title": "9. Deployment & Environment",
        "content": [
            ("heading", "Backend — Render"),
            ("body", "Entry point: gunicorn core.wsgi (via Procfile). Static files collected by WhiteNoise middleware — no separate CDN needed. Database: Render managed PostgreSQL connected via DATABASE_URL env var. Media: Cloudinary for avatars."),
            ("heading", "Frontend — Vercel"),
            ("body", "npm run build -> Vite bundles to dist/. VITE_API_URL=https://employee-portal-r59t.onrender.com (set in frontend/env.production). All routing is client-side; Vercel rewrites all paths to index.html."),
            ("heading", "Environment Variables — Backend"),
            ("table", [
                ["Variable", "Purpose"],
                ["SECRET_KEY", "Django cryptographic signing key"],
                ["DATABASE_URL", "PostgreSQL connection string"],
                ["CLOUDINARY_CLOUD_NAME", "Cloudinary account identifier"],
                ["CLOUDINARY_API_KEY", "Cloudinary API access key"],
                ["CLOUDINARY_API_SECRET", "Cloudinary API signing secret"],
                ["DEBUG", "True for dev, omit (defaults False) for prod"],
                ["USE_LOCAL_MEDIA", "true to skip Cloudinary and write avatars to disk"],
            ]),
            ("heading", "Environment Variables — Frontend"),
            ("table", [
                ["Variable", "Purpose"],
                ["VITE_API_URL", "Backend base URL (localhost:8000 dev, Render URL prod)"],
            ]),
            ("heading", "Run Locally from Scratch"),
            ("code", """\
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # fill in your values
python manage.py migrate
python manage.py seed_db   # optional: seed test data
python manage.py runserver # -> http://localhost:8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                # -> http://localhost:5173"""),
        ]
    },
    {
        "title": "10. Performance & Scalability",
        "content": [
            ("heading", "What Is Done Well"),
            ("table", [
                ["Optimization", "Where"],
                ["select_related on FK traversals", "All list views"],
                ["prefetch_related with scoped Prefetch()", "ManagerTeamUpdatesView — fetches tasks for target date range only"],
                ["Pagination on employee list", "StandardResultsSetPagination (page_size=10, max=100)"],
                ["DB-level unique_together", "DailySubmission (employee, date) — prevents race condition duplicates"],
                ["conn_max_age=600", "Persistent DB connections — avoids reconnect overhead per request"],
                ["conn_health_checks=True", "Automatically recycles stale connections"],
            ]),
            ("heading", "Known Weak Points"),
            ("table", [
                ["Issue", "Location", "Impact"],
                ["Python loop over all employees", "team_updates view (employee)", "O(n) loop with per-employee queries — N+1 risk under load"],
                ["get_team_structure loops assigned_employees", "ProjectSerializer", "Per-project Python loop, no prefetch"],
                ["No indexes beyond Django defaults", "models.py", "Queries on role, status, date will full-scan as rows grow"],
                ["No ownership check on DailyTaskDetail", "views.py:113", "Any authenticated user can read/mutate any task by ID"],
                ["No caching layer", "Everywhere", "Repeated identical requests (e.g., departments) hit the DB every time"],
            ]),
        ]
    },
    {
        "title": "11. Security",
        "content": [
            ("heading", "Security Assessment"),
            ("table", [
                ["Threat", "Status", "Detail"],
                ["SQL Injection", "Protected", "Django ORM uses parameterized queries. No raw SQL written."],
                ["XSS", "Mostly protected", "React escapes output by default. No dangerouslySetInnerHTML used."],
                ["CSRF", "N/A for API", "Token auth in Authorization header is CSRF-immune."],
                ["Password storage", "Protected", "create_user and set_password use PBKDF2 hashing."],
                ["Unauthorized access", "Protected", "IsAuthenticated on all endpoints; role checks on manager routes."],
                ["Broken object-level auth", "Partial gap", "DailyTaskDetail does not verify the requesting user owns the task."],
                ["CORS", "Open", "CORS_ALLOW_ALL_ORIGINS = True — fine for internal tool."],
                ["ALLOWED_HOSTS", "Open", "ALLOWED_HOSTS = ['*'] — should list the Render hostname in prod."],
                ["Token brute force", "No protection", "No rate limiting on POST /api/login/. Consider django-ratelimit."],
                ["API docs public", "Low risk", "Swagger/ReDoc accessible without auth — add auth in prod if sensitive."],
                ["Token in localStorage", "Acceptable", "XSS-accessible. OK for internal portal; use httpOnly cookies for public apps."],
            ]),
        ]
    },
    {
        "title": "12. Documentation",
        "content": [
            ("heading", "API Documentation"),
            ("body", "Auto-generated by drf-spectacular and live at:"),
            ("body", "  Swagger UI  -> http://localhost:8000/api/docs/swagger/ (interactive, try-it-out)"),
            ("body", "  ReDoc       -> http://localhost:8000/api/docs/redoc/ (read-only, clean layout)"),
            ("body", "  Raw Schema  -> http://localhost:8000/api/schema/ (OpenAPI JSON)"),
            ("body", "Schema is auto-derived from serializers and views — no manual maintenance needed."),
            ("heading", "Assumptions & Known Limitations"),
            ("body", "is_manager flag and role='Manager' are redundant — both exist and both are checked. They should stay in sync; there is no DB constraint enforcing it."),
            ("body", "No salary module exists yet (referenced in the Swagger description as a pending module)."),
            ("body", "TIME_ZONE = 'UTC' in settings, but task dates are stored as the client's local date string — date filtering trusts the date sent by the frontend, not the server clock."),
            ("body", "DailyTask.submission is nullable — tasks created before the submit step have no DailySubmission link."),
            ("body", "temp_migration_fix field on Employee is a leftover from a migration and serves no current business purpose."),
        ]
    },
]


class DocPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)
        self.set_margins(20, 20, 20)

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 8, "Employee Portal — Technical Documentation", align="C")
        self.ln(2)
        self.set_draw_color(220, 220, 220)
        self.set_line_width(0.2)
        self.line(20, self.get_y(), self.w - 20, self.get_y())
        self.ln(4)
        self.set_text_color(0, 0, 0)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def cover_page(self):
        self.add_page()
        self.set_fill_color(15, 23, 42)
        self.rect(0, 0, self.w, self.h, "F")

        self.set_y(60)
        self.set_font("Helvetica", "B", 28)
        self.set_text_color(255, 255, 255)
        self.multi_cell(0, 12, "Employee Portal", align="C")

        self.ln(4)
        self.set_font("Helvetica", "", 16)
        self.set_text_color(148, 163, 184)
        self.multi_cell(0, 8, "Complete Technical Documentation", align="C")

        self.ln(16)
        self.set_draw_color(56, 189, 248)
        self.set_line_width(0.5)
        self.line(60, self.get_y(), self.w - 60, self.get_y())

        self.ln(16)
        self.set_font("Helvetica", "", 11)
        self.set_text_color(203, 213, 225)
        details = [
            ("Stack", "React 19 + Django 6 + PostgreSQL"),
            ("Auth", "DRF Token Authentication"),
            ("Deployment", "Render (backend) + Vercel (frontend)"),
            ("Date", "May 2026"),
            ("Author", "Rupesh Bhatta"),
        ]
        for label, value in details:
            self.set_font("Helvetica", "B", 10)
            self.set_text_color(148, 163, 184)
            self.cell(50, 8, label + ":", align="R")
            self.set_font("Helvetica", "", 10)
            self.set_text_color(226, 232, 240)
            self.cell(0, 8, value)
            self.ln(6)

        self.set_text_color(0, 0, 0)

    def toc_page(self, sections):
        self.add_page()
        self.set_fill_color(248, 250, 252)
        self.rect(0, 0, self.w, self.h, "F")

        self.set_font("Helvetica", "B", 18)
        self.set_text_color(15, 23, 42)
        self.ln(4)
        self.cell(0, 12, "Table of Contents", align="C")
        self.ln(16)

        toc_items = [
            "1.  Architecture & Project Structure",
            "2.  Database Design",
            "3.  API / Backend Knowledge",
            "4.  Frontend Behavior",
            "5.  Authentication & Authorization",
            "6.  Validation & Business Logic",
            "7.  Testing",
            "8.  Error Handling & Edge Cases",
            "9.  Deployment & Environment",
            "10. Performance & Scalability",
            "11. Security",
            "12. Documentation",
        ]
        for item in toc_items:
            self.set_font("Helvetica", "", 12)
            self.set_text_color(30, 41, 59)
            self.set_x(40)
            self.cell(0, 10, item)
            self.ln(2)

        self.set_text_color(0, 0, 0)

    def section_title(self, title):
        self.add_page()
        self.set_fill_color(15, 23, 42)
        self.rect(0, 15, self.w, 22, "F")
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(255, 255, 255)
        self.set_y(20)
        self.cell(0, 12, title, align="C")
        self.set_text_color(0, 0, 0)
        self.ln(16)

    def sub_heading(self, text):
        self.ln(3)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(15, 23, 42)
        self.set_fill_color(241, 245, 249)
        self.set_x(20)
        self.cell(self.w - 40, 8, "  " + text, fill=True)
        self.ln(10)
        self.set_text_color(0, 0, 0)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(51, 65, 85)
        self.set_x(20)
        self.multi_cell(self.w - 40, 6, text)
        self.ln(2)
        self.set_text_color(0, 0, 0)

    def code_block(self, text):
        self.set_font("Courier", "", 8)
        self.set_fill_color(30, 41, 59)
        self.set_text_color(226, 232, 240)
        lines = text.split("\n")
        padding = 4
        block_h = len(lines) * 5 + padding * 2
        x = 20
        w = self.w - 40
        if self.get_y() + block_h > self.h - 25:
            self.add_page()
        self.set_x(x)
        self.rect(x, self.get_y(), w, block_h, "F")
        self.set_y(self.get_y() + padding)
        for line in lines:
            self.set_x(x + padding)
            self.cell(w - padding * 2, 5, line)
            self.ln(5)
        self.ln(padding + 2)
        self.set_text_color(0, 0, 0)

    def data_table(self, rows):
        if not rows:
            return
        self.ln(2)
        headers = rows[0]
        data = rows[1:]
        col_count = len(headers)
        usable_w = self.w - 40

        # Dynamic column widths based on content
        col_widths = [usable_w / col_count] * col_count

        # Header row
        self.set_fill_color(15, 23, 42)
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 8)
        self.set_x(20)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 8, str(h), border=0, fill=True, align="C")
        self.ln(8)

        # Data rows
        self.set_font("Helvetica", "", 8)
        for row_idx, row in enumerate(data):
            fill = row_idx % 2 == 0
            self.set_fill_color(248, 250, 252) if fill else self.set_fill_color(255, 255, 255)
            self.set_text_color(30, 41, 59)

            # Calculate row height based on longest cell
            max_lines = 1
            for i, cell in enumerate(row):
                text = str(cell)
                approx_chars_per_line = int(col_widths[i] / 2.2)
                if approx_chars_per_line > 0:
                    lines_needed = max(1, -(-len(text) // approx_chars_per_line))
                    max_lines = max(max_lines, lines_needed)
            row_h = max_lines * 5 + 2

            if self.get_y() + row_h > self.h - 25:
                self.add_page()
                # Re-draw header
                self.set_fill_color(15, 23, 42)
                self.set_text_color(255, 255, 255)
                self.set_font("Helvetica", "B", 8)
                self.set_x(20)
                for i, h in enumerate(headers):
                    self.cell(col_widths[i], 8, str(h), border=0, fill=True, align="C")
                self.ln(8)
                self.set_font("Helvetica", "", 8)

            self.set_x(20)
            y_before = self.get_y()
            for i, cell in enumerate(row):
                self.set_xy(20 + sum(col_widths[:i]), y_before)
                self.set_fill_color(248, 250, 252 if fill else 255)
                self.multi_cell(col_widths[i], 5, str(cell), border=0, fill=True)
            self.set_y(y_before + row_h)

        self.ln(6)
        self.set_text_color(0, 0, 0)


def build_pdf():
    pdf = DocPDF()
    pdf.cover_page()
    pdf.toc_page(SECTIONS)

    for section in SECTIONS:
        pdf.section_title(section["title"])
        for item_type, item_data in section["content"]:
            if item_type == "heading":
                pdf.sub_heading(item_data)
            elif item_type == "body":
                pdf.body_text(item_data)
            elif item_type == "code":
                pdf.code_block(item_data)
            elif item_type == "table":
                pdf.data_table(item_data)

    pdf.output(OUTPUT)
    print(f"PDF saved to: {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
