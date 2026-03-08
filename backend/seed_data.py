import os
import sys
import django
import random
from datetime import timedelta
from django.utils import timezone

# --- 1. PRODUCTION GUARD ---
# This ensures that even if this file is imported by accident on Render,
# it will stop immediately and not mess with your production DB.
if any([os.environ.get('RENDER'), os.environ.get('VERCEL')]):
    print("\n[!] SAFEGUARD: Seed script execution blocked on Production (Render/Vercel).")
    # We use return if imported, or exit if run directly
    if __name__ == "__main__":
        sys.exit(0)

# --- 2. DJANGO SETUP ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings') 

try:
    django.setup()
    print("--- Django Setup Successful ---")
except Exception as e:
    print(f"--- Django Setup Failed: {e} ---")
    sys.exit(1)

# --- 3. SEEDING LOGIC ---
def seed_db():
    """
    Imports are inside the function to prevent 'Table Not Found' 
    errors during the initial Django migration/deployment phase.
    """
    from faker import Faker
    from django.contrib.auth.models import User
    # Lazy import models so they don't trigger database queries on startup
    from employee_portal.models import Department, Project, Employee, DailySubmission, DailyTask

    fake = Faker()

    # CONFIGURATION
    KEEP_USERNAMES = ['test_manager', 'rupeshxb', 'b.shakya', 'shashank.a'] 
    TECH_ROLES = [
        'Frontend Developer', 'Backend Developer', 'Full Stack Engineer', 
        'DevOps Engineer', 'UI/UX Designer', 'QA Automation Engineer', 
        'Data Scientist', 'Cloud Architect', 'Scrum Master', 'Mobile App Developer'
    ]

    print("--- Cleaning up non-essential data... ---")
    to_delete = User.objects.exclude(is_superuser=True).exclude(username__in=KEEP_USERNAMES)
    count = to_delete.count()
    to_delete.delete() 
    print(f"Successfully removed {count} old accounts.")

    print("--- Starting Tech-Focused Database Seed ---")

    # A. Fetch Existing Departments
    dept_objs = list(Department.objects.all())
    if not dept_objs:
        print("\n[!] ERROR: No departments found. Please add a Department in Admin first.")
        return
    
    # B. Projects
    project_names = ['Cloud Migration', 'Mobile API Redesign', 'Security Audit 2026', 'AI Chatbot Integration']
    colors = ["#0EA5E9", "#22C55E", "#EF4444", "#F59E0B"]
    project_objs = []
    for i, name in enumerate(project_names):
        p, _ = Project.objects.get_or_create(
            name=name, 
            defaults={'color_code': colors[i % len(colors)], 'status': 'Active'}
        )
        project_objs.append(p)

    # C. Users (20 Tech Professionals)
    for i in range(20):
        u_name = f"seed_{fake.user_name()}{random.randint(10, 99)}"
        user = User.objects.create_user(
            username=u_name,
            password='password123',
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.email()
        )

        is_mgr = (i < 3)
        emp = Employee.objects.create(
            user=user,
            designation=random.choice(TECH_ROLES),
            is_manager=is_mgr,
            role='Manager' if is_mgr else 'Employee',
            department=random.choice(dept_objs)
        )

        # D. Tasks for last 5 days
        for day_offset in range(5):
            target_date = timezone.now().date() - timedelta(days=day_offset)
            sub, _ = DailySubmission.objects.get_or_create(
                employee=emp,
                date=target_date,
                defaults={'meeting_count': random.randint(1, 4)}
            )

            for _ in range(random.randint(2, 4)):
                verbs = ['Refactored', 'Debugged', 'Implemented', 'Reviewed', 'Optimized']
                nouns = ['unit tests', 'API endpoints', 'CSS modules', 'database migrations']
                tech_content = f"{random.choice(verbs)} {random.choice(nouns)}: {fake.sentence(nb_words=6)}"

                DailyTask.objects.create(
                    employee=emp,
                    project=random.choice(project_objs),
                    submission=sub,
                    content=tech_content,
                    is_blocker=random.choice([True, False, False, False]),
                    date=target_date
                )

    print("\n--- Success! Populated 20 Tech Users. ---")

if __name__ == "__main__":
    seed_db()