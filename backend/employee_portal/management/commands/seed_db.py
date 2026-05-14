"""Seed the local database with employees for team-structure testing.

Additive only: does not delete existing rows. Safe to re-run; collisions on
unique fields (username, employee_id) are avoided by suffixing a counter.

Avatars are downloaded from i.pravatar.cc and saved through Django's default
media storage. Set USE_LOCAL_MEDIA=true in backend/.env so they go to
backend/media/ instead of the shared Cloudinary account.
"""

import io
import os
import random
import sys
from datetime import timedelta

import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from faker import Faker

from employee_portal.models import (
    DailySubmission, DailyTask, Department, Designation,
    Employee, Project, Tag,
)


PRODUCTION_ENV_VARS = ('RENDER', 'VERCEL')

DEFAULT_DEPARTMENTS = ['Engineering', 'Product Design', 'Quality Assurance', 'Data Science']

DESIGNATIONS_BY_DEPT = {
    'Engineering': [
        ('Frontend Developer', 'frontend_developer'),
        ('Backend Developer', 'backend_developer'),
        ('Full Stack Engineer', 'fullstack_engineer'),
        ('DevOps Engineer', 'devops_engineer'),
        ('Mobile App Developer', 'mobile_developer'),
    ],
    'Product Design': [
        ('UI/UX Designer', 'ui_ux_designer'),
        ('Product Designer', 'product_designer'),
    ],
    'Quality Assurance': [
        ('QA Automation Engineer', 'qa_automation'),
        ('Manual QA Engineer', 'qa_manual'),
    ],
    'Data Science': [
        ('Data Scientist', 'data_scientist'),
        ('ML Engineer', 'ml_engineer'),
    ],
}

DEFAULT_TAGS = [
    ('Developers', 'developers', '#2563EB'),
    ('Designers', 'designers', '#A855F7'),
    ('QA', 'qa', '#F59E0B'),
    ('Data', 'data', '#10B981'),
]

PROJECT_SEED = [
    ('Cloud Migration', 'CLM', '#0EA5E9'),
    ('Mobile API Redesign', 'MAR', '#22C55E'),
    ('Security Audit 2026', 'SA26', '#EF4444'),
    ('AI Chatbot Integration', 'AIC', '#F59E0B'),
]


class Command(BaseCommand):
    help = 'Populate the local database with employees, projects, and tasks for team-structure testing.'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=20,
                            help='Number of employees to create (default: 20)')
        parser.add_argument('--no-avatars', action='store_true',
                            help='Skip downloading avatars (faster, frontend falls back to ui-avatars.com)')

    def handle(self, *args, **options):
        # --- Production guard ---
        for var in PRODUCTION_ENV_VARS:
            if os.environ.get(var):
                raise CommandError(
                    f'Refusing to seed: {var} is set, this looks like a production environment.'
                )

        count = options['count']
        skip_avatars = options['no_avatars']

        if not skip_avatars and not getattr(settings, 'USE_LOCAL_MEDIA', False):
            raise CommandError(
                'Avatars would be uploaded to Cloudinary (the shared media store). '
                'Set USE_LOCAL_MEDIA=true in backend/.env to write to backend/media/ instead, '
                'or pass --no-avatars to skip avatar uploads.'
            )

        fake = Faker()

        self.stdout.write(self.style.MIGRATE_HEADING('--- Seeding local database (additive) ---'))

        departments = self._ensure_departments()
        designations_by_dept = self._ensure_designations(departments)
        tags = self._ensure_tags()
        self._link_designations_to_tags(designations_by_dept, tags)
        projects = self._ensure_projects()

        created = 0
        for i in range(count):
            dept = random.choice(departments)
            dept_designations = designations_by_dept[dept.name]
            designation = random.choice(dept_designations)

            user = self._create_user(fake)
            if not user:
                continue

            is_manager = (i < max(2, count // 8))
            employee = Employee.objects.create(
                user=user,
                employee_id=self._unique_employee_id(),
                employment_type=random.choice(['Full-Time', 'Full-Time', 'Full-Time', 'Contract', 'Internship']),
                personal_email=fake.email(),
                emergency_contact=fake.phone_number()[:20],
                pan_number=fake.bothify(text='?????####?', letters='ABCDEFGHIJ'),
                joined_date=fake.date_between(start_date='-3y', end_date='-30d'),
                designation=designation,
                is_manager=is_manager,
                department=dept,
                role='Manager' if is_manager else 'Employee',
                phone_number=fake.phone_number()[:20],
                status='Active',
            )

            employee.projects.set(random.sample(projects, k=random.randint(1, min(3, len(projects)))))

            if not skip_avatars:
                self._attach_avatar(employee)

            self._seed_tasks(fake, employee, projects)
            created += 1
            self.stdout.write(f'  [{created}/{count}] {user.username} -> {dept.name} / {designation.name}')

        self.stdout.write(self.style.SUCCESS(
            f'\n--- Done. Created {created} employees across {len(departments)} departments. ---'
        ))

    # --- Helpers ---

    def _ensure_departments(self):
        depts = []
        for name in DEFAULT_DEPARTMENTS:
            dept, _ = Department.objects.get_or_create(name=name)
            depts.append(dept)
        return depts

    def _ensure_designations(self, departments):
        result = {}
        for dept in departments:
            entries = DESIGNATIONS_BY_DEPT.get(dept.name, [])
            created = []
            for display, system in entries:
                # Match by name first so we attach to legacy rows (where
                # system_name may be NULL) instead of duplicating them.
                d = Designation.objects.filter(name=display).first()
                if d is None:
                    d = Designation.objects.create(name=display, system_name=system, status='Active')
                elif not d.system_name:
                    d.system_name = system
                    d.save(update_fields=['system_name'])
                created.append(d)
            result[dept.name] = created
        return result

    def _ensure_tags(self):
        tags = {}
        for display, system, color in DEFAULT_TAGS:
            tag = Tag.objects.filter(system_name=system).first() or \
                  Tag.objects.filter(display_name=display).first()
            if tag is None:
                tag = Tag.objects.create(
                    display_name=display, system_name=system,
                    color=color, status='Active',
                )
            elif not tag.system_name:
                tag.system_name = system
                tag.save(update_fields=['system_name'])
            tags[system] = tag
        return tags

    def _link_designations_to_tags(self, designations_by_dept, tags):
        mapping = {
            'Engineering': 'developers',
            'Product Design': 'designers',
            'Quality Assurance': 'qa',
            'Data Science': 'data',
        }
        for dept_name, designations in designations_by_dept.items():
            tag = tags.get(mapping.get(dept_name))
            if not tag:
                continue
            for d in designations:
                tag.designations.add(d)

    def _ensure_projects(self):
        projects = []
        for name, acronym, color in PROJECT_SEED:
            p, _ = Project.objects.get_or_create(
                name=name,
                defaults={
                    'acronym': acronym,
                    'color_code': color,
                    'status': 'Active',
                    'client_name': f'{name} Client',
                    'start_date': timezone.now().date() - timedelta(days=60),
                    'end_date': timezone.now().date() + timedelta(days=180),
                },
            )
            projects.append(p)
        return projects

    def _create_user(self, fake):
        first = fake.first_name()
        last = fake.last_name()
        base = f'seed_{first.lower()}.{last.lower()}'
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            suffix += 1
            username = f'{base}{suffix}'
            if suffix > 50:
                self.stdout.write(self.style.WARNING(f'  Skipping {base}: too many collisions'))
                return None
        return User.objects.create_user(
            username=username,
            password='password123',
            first_name=first,
            last_name=last,
            email=f'{username}@example.com',
        )

    def _unique_employee_id(self):
        while True:
            candidate = f'EMP-{random.randint(10000, 99999)}'
            if not Employee.objects.filter(employee_id=candidate).exists():
                return candidate

    def _attach_avatar(self, employee):
        img_id = random.randint(1, 70)
        url = f'https://i.pravatar.cc/300?img={img_id}'
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
        except requests.RequestException as e:
            self.stdout.write(self.style.WARNING(
                f'  avatar fetch failed for {employee.user.username}: {e}'
            ))
            return
        filename = f'{employee.user.username}.jpg'
        employee.avatar.save(filename, ContentFile(resp.content), save=True)

    def _seed_tasks(self, fake, employee, projects):
        verbs = ['Refactored', 'Debugged', 'Implemented', 'Reviewed', 'Optimized']
        nouns = ['unit tests', 'API endpoints', 'CSS modules', 'database migrations']
        for day_offset in range(5):
            target_date = timezone.now().date() - timedelta(days=day_offset)
            submission, _ = DailySubmission.objects.get_or_create(
                employee=employee,
                date=target_date,
                defaults={'meeting_count': random.randint(1, 4)},
            )
            for _ in range(random.randint(2, 4)):
                content = f'{random.choice(verbs)} {random.choice(nouns)}: {fake.sentence(nb_words=6)}'
                DailyTask.objects.create(
                    employee=employee,
                    project=random.choice(projects),
                    submission=submission,
                    content=content,
                    is_blocker=random.choice([True, False, False, False]),
                    date=target_date,
                )
