"""
Patches existing Firestore user docs:
  - university_id: 'youngstown' → 'ysu'
  - university_id: 'ohio'       → 'osu'
  - buzz_balance: 0 (non-dev, non-admin users) → 20

Run from repo root:
    source scripts/.venv/bin/activate
    python scripts/patch_university_ids.py
"""

import firebase_admin
from firebase_admin import credentials, firestore

app = firebase_admin.initialize_app(
    credentials.ApplicationDefault(),
    {'projectId': 'buzzoncampus-f9257'}
)
db = firestore.client()

REMAP = {
    'youngstown': 'ysu',
    'ohio':       'osu',
}

def patch():
    users_ref = db.collection('users')
    all_users = users_ref.stream()

    id_fixed = 0
    buzz_fixed = 0

    for doc in all_users:
        data = doc.to_dict()
        updates = {}

        # Fix university_id
        uid_val = data.get('university_id', '')
        if uid_val in REMAP:
            updates['university_id'] = REMAP[uid_val]

        # Fix buzz_balance for real (non-dev) users stuck at 0
        if not data.get('is_dev', False) and data.get('buzz_balance', 0) == 0:
            updates['buzz_balance'] = 20

        if updates:
            users_ref.document(doc.id).update(updates)
            print(f'  ✓ {data.get("email", doc.id):35s}  {updates}')
            if 'university_id' in updates:
                id_fixed += 1
            if 'buzz_balance' in updates:
                buzz_fixed += 1

    print(f'\nDone. university_id patched: {id_fixed}  |  buzz_balance patched: {buzz_fixed}')

if __name__ == '__main__':
    patch()
