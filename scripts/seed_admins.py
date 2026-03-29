"""
Creates admin Firebase Auth accounts + Firestore user + admin docs.
Run from repo root:
    source scripts/.venv/bin/activate
    python scripts/seed_admins.py
"""

import firebase_admin
from firebase_admin import credentials, auth, firestore
from datetime import datetime, timezone

app = firebase_admin.initialize_app(
    credentials.ApplicationDefault(),
    {'projectId': 'buzzoncampus-f9257'}
)
db = firestore.client()

ADMIN_PASSWORD = 'adminPassword'

# university_id 'general' = super-admin (sees & approves all universities)
# anything else = scoped to that university only
ADMINS = [
    {'email': 'admin@ysu.edu',   'username': 'admin_ysu',    'university_id': 'ysu',     'color': '#CC0000'},
    {'email': 'admin@kent.edu',  'username': 'admin_kent',   'university_id': 'kent',    'color': '#002664'},
    {'email': 'admin@osu.edu',   'username': 'admin_osu',    'university_id': 'osu',     'color': '#BB0000'},
    {'email': 'admin@gmail.com', 'username': 'super_admin',  'university_id': 'general', 'color': '#7C3AED'},
]

def seed():
    print('Seeding admin accounts...\n')
    now = datetime.now(timezone.utc)

    for a in ADMINS:
        email = a['email']
        try:
            # 1 — Create or fetch existing Firebase Auth user
            try:
                user = auth.get_user_by_email(email)
                uid = user.uid
                print(f'  (already exists) {email}  →  uid: {uid}')
            except auth.UserNotFoundError:
                user = auth.create_user(
                    email=email,
                    password=ADMIN_PASSWORD,
                    display_name=a['username'],
                )
                uid = user.uid
                print(f'  ✓ Created auth    {email}  →  uid: {uid}')

            # 2 — Write Firestore user doc (enables LoginForm sign-in)
            db.collection('users').document(uid).set({
                'email':                email,
                'username':             a['username'],
                'university_id':        a['university_id'],
                'buzz_balance':         0,
                'volunteer_hours_total': 0,
                'color':                a['color'],
                'avatar_url':           None,
                'email_verified':       True,   # skip OTP — pre-verified admin account
                'is_dev':               True,
                'created_at':           now,
            }, merge=True)

            # 3 — Write Firestore admin doc (grants admin panel access)
            db.collection('admins').document(uid).set({
                'email':          email,
                'university_id':  a['university_id'],
                'is_dev':         True,
                'created_at':     now,
            }, merge=True)

            scope = 'ALL universities (super-admin)' if a['university_id'] == 'general' \
                    else f"{a['university_id'].upper()} only"
            print(f'  ✓ Firestore docs  {email}  scope: {scope}\n')

        except Exception as e:
            print(f'  ✗ Failed {email}: {e}\n')

    print('Done.')
    print(f'Password for all admin accounts: {ADMIN_PASSWORD}\n')
    print(f'{"Email":<25}  Scope')
    print('-' * 55)
    for a in ADMINS:
        scope = 'ALL universities (super-admin)' if a['university_id'] == 'general' \
                else f"{a['university_id'].upper()} only"
        print(f"  {a['email']:<23}  {scope}")

if __name__ == '__main__':
    seed()
