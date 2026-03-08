import os
import sys
import django
import random
from datetime import timedelta
from django.utils import timezone

# --- 1. LOCAL-ONLY GUARD ---
if any([os.environ.get('RENDER'), os.environ.get('VERCEL'), os.environ.get('NODE_ENV') == 'production']):
    print("\n [!] CRITICAL: Seeding script blocked. Production environment detected.")
    sys.exit(1)

# --- 2. THE PATH FIX ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings') 

try:
    django.setup()
    print("--- Django Setup Successful (core.settings) ---")
except Exception as e:
    print(f"--- Django Setup Failed: {e} ---")
    sys.exit(1)

# --- 3. MODEL IMPORTS ---
from faker import Faker
from django.contrib.auth.models import User
from employee_portal.models import Department, Project, Employee, DailySubmission, DailyTask

fake = Faker()

# --- CONFIGURATION ---
# ADD YOUR REAL USERNAMES HERE SO THEY DON'T GET DELETED
KEEP_USERNAMES = ['test_manager', 'rupeshxb', 'b.shakya', 'shashank.a'] 

TECH_ROLES = [
    'Frontend Developer', 'Backend Developer', 'Full Stack Engineer', 
    'DevOps Engineer', 'UI/UX Designer', 'QA Automation Engineer', 
    'Data Scientist', 'Cloud Architect', 'Scrum Master', 'Mobile App Developer',
    'System Administrator', 'Cybersecurity Analyst', 'Product Manager'
]

# --- 4. AGGRESSIVE CLEANUP FUNCTION ---
def clean_database():
    """Deletes all users EXCEPT superusers and those in the KEEP_USERNAMES list"""
    print("--- Cleaning up non-essential data... ---")
    
    # We target users who are NOT superusers AND not in our keep list
    to_delete = User.objects.exclude(is_superuser=True).exclude(username__in=KEEP_USERNAMES)
    
    count = to_delete.count()
    to_delete.delete() # This cascades to Employee, Tasks, and Submissions
    
    print(f"Successfully removed {count} old/general accounts. (Kept: {KEEP_USERNAMES} and Admins)")

# --- 5. SEEDING FUNCTION ---
def seed_db():
    clean_database() # Wipe the "plumbers" and "teachers" first

    print("--- Starting Tech-Focused Database Seed ---")

    # A. Fetch Existing Departments
    dept_objs = list(Department.objects.all())
    if not dept_objs:
        print("\n[!] ERROR: No departments found in your database. Add one in Admin first.")
        return
    
    # B. Projects
    project_names = ['Cloud Migration', 'Mobile API Redesign', 'Security Audit 2026', 'AI Chatbot Integration', 'Admin Dashboard v2']
    colors = ["#0EA5E9", "#22C55E", "#EF4444", "#F59E0B", "#6366F1"]
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
        role_str = 'Manager' if is_mgr else 'Employee'
        
        emp = Employee.objects.create(
            user=user,
            designation=random.choice(TECH_ROLES),
            is_manager=is_mgr,
            role=role_str,
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
                verbs = ['Refactored', 'Debugged', 'Implemented', 'Reviewed', 'Optimized', 'Deployed']
                nouns = ['unit tests', 'API endpoints', 'CSS modules', 'database migrations', 'docker containers']
                tech_content = f"{random.choice(verbs)} {random.choice(nouns)}: {fake.sentence(nb_words=6)}"

                DailyTask.objects.create(
                    employee=emp,
                    project=random.choice(project_objs),
                    submission=sub,
                    content=tech_content,
                    is_blocker=random.choice([True, False, False, False, False, False]),
                    date=target_date
                )

    print("\n--- Success! ---")
    print(f"Populated 20 Tech Users into your existing departments.")

if __name__ == "__main__":
    seed_db()