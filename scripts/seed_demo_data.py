"""
Seed realistic demo pins for YSU, Kent State, and OSU.
Run from repo root:
    source scripts/.venv/bin/activate
    python scripts/seed_demo_data.py

Uses serviceAccountKey.json at repo root (or ADC if not found).
"""

import os
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone, timedelta

# ── Auth ──────────────────────────────────────────────────────────────────────
KEY = 'serviceAccountKey.json'
if os.path.exists(KEY):
    cred = credentials.Certificate(KEY)
else:
    cred = credentials.ApplicationDefault()

app = firebase_admin.initialize_app(cred, {'projectId': 'buzzoncampus-f9257'})
db = firestore.client()

now = datetime.now(timezone.utc)

def ts(days_offset=0, hours_offset=0):
    """Return a datetime offset from now."""
    return now + timedelta(days=days_offset, hours=hours_offset)

# ── Demo pins ─────────────────────────────────────────────────────────────────
# Each pin maps 1-to-1 to the Firestore pins/{pinId} schema.
# is_seed = False so they show up for all users (not just devs).
PINS = [

    # ── YOUNGSTOWN STATE UNIVERSITY ──────────────────────────────────────────
    {
        'university_id': 'ysu',
        'type': 'event',
        'title': 'Spring Club Fair',
        'description': 'Check out 80+ student orgs at the Kilcawley Center atrium. Free food, giveaways, and a chance to find your people before the semester ends.',
        'lat': 41.09923, 'lng': -80.64581,
        'buzz_reward': 8,
        'volunteer_hours': None,
        'event_date': ts(days_offset=2, hours_offset=10).isoformat(),
        'username': 'ysu_admin', 'user_color': '#CC0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'ysu',
        'type': 'event',
        'title': 'YSU Penguins vs. Wright State',
        'description': 'Come out and cheer on the Penguins! Student tickets are free with your YSU ID. Gates open at 6 PM, tip-off at 7:30 PM.',
        'lat': 41.10231, 'lng': -80.64762,
        'buzz_reward': 10,
        'volunteer_hours': None,
        'event_date': ts(days_offset=3, hours_offset=19).isoformat(),
        'username': 'ysu_admin', 'user_color': '#CC0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'ysu',
        'type': 'event',
        'title': 'Open Mic Night — Kilcawley Stage',
        'description': 'Poets, musicians, comedians — all welcome. Sign-up sheet at the door. Hosted by YSU Student Programming Board. Free coffee.',
        'lat': 41.09915, 'lng': -80.64600,
        'buzz_reward': 6,
        'volunteer_hours': None,
        'event_date': ts(days_offset=1, hours_offset=18).isoformat(),
        'username': 'ysu_admin', 'user_color': '#CC0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'ysu',
        'type': 'volunteer',
        'title': 'Campus Food Pantry Restock',
        'description': 'Help sort and shelve donations at the YSU Student Food Pantry in Cushwa Hall. No experience needed. Every shift earns volunteer credit.',
        'lat': 41.09854, 'lng': -80.64720,
        'buzz_reward': 15,
        'volunteer_hours': 3,
        'event_date': ts(days_offset=1, hours_offset=9).isoformat(),
        'username': 'ysu_admin', 'user_color': '#CC0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'ysu',
        'type': 'volunteer',
        'title': 'Campus Green Cleanup',
        'description': 'Grab a pair of gloves and help us clean up the quad and surrounding paths before the spring showcase. Bags and supplies provided.',
        'lat': 41.09980, 'lng': -80.64510,
        'buzz_reward': 10,
        'volunteer_hours': 2,
        'event_date': ts(days_offset=4, hours_offset=8).isoformat(),
        'username': 'ysu_admin', 'user_color': '#CC0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'ysu',
        'type': 'volunteer',
        'title': 'Peer Tutoring — Math Center',
        'description': 'The Youngstown Math Center needs volunteer tutors for Calculus I & II. Flexible scheduling. Earns service-learning credit.',
        'lat': 41.09990, 'lng': -80.64890,
        'buzz_reward': 12,
        'volunteer_hours': 2,
        'event_date': ts(days_offset=0, hours_offset=14).isoformat(),
        'username': 'ysu_admin', 'user_color': '#CC0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'ysu',
        'type': 'help',
        'title': 'Study Group — Calc 2 Final Prep',
        'description': 'Forming a study group for MATH 1572. Meeting at Maag Library room 212. Bring your notes from chapters 8–11.',
        'lat': 41.10103, 'lng': -80.64820,
        'buzz_reward': 5,
        'volunteer_hours': None,
        'event_date': ts(days_offset=1, hours_offset=15).isoformat(),
        'username': 'ysu_admin', 'user_color': '#CC0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'ysu',
        'type': 'help',
        'title': 'ISO: Organic Chemistry Textbook',
        'description': 'Looking to borrow or buy Clayden\'s Organic Chemistry (2nd ed). Will pay up to $30 or trade a BIOL 2601 textbook.',
        'lat': 41.10150, 'lng': -80.64780,
        'buzz_reward': 3,
        'volunteer_hours': None,
        'event_date': None,
        'username': 'ysu_admin', 'user_color': '#CC0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'ysu',
        'type': 'help',
        'title': 'Need a Ride — Airport Shuttle (Spring Break)',
        'description': 'Heading to Pittsburgh airport on Friday morning. Have one seat available — happy to split gas costs. DM me!',
        'lat': 41.10050, 'lng': -80.64900,
        'buzz_reward': 7,
        'volunteer_hours': None,
        'event_date': ts(days_offset=5, hours_offset=6).isoformat(),
        'username': 'ysu_admin', 'user_color': '#CC0000', 'avatar_model': '/models/red.glb',
    },

    # ── KENT STATE UNIVERSITY ─────────────────────────────────────────────────
    {
        'university_id': 'kent',
        'type': 'event',
        'title': 'Kent State Spring Career Fair',
        'description': 'Over 120 employers recruiting for internships and full-time positions. Bring printed resumes. Business casual dress required.',
        'lat': 41.15481, 'lng': -81.34270,
        'buzz_reward': 10,
        'volunteer_hours': None,
        'event_date': ts(days_offset=2, hours_offset=10).isoformat(),
        'username': 'admin_kent', 'user_color': '#002664', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'kent',
        'type': 'event',
        'title': 'Flasher Fest — Risman Plaza',
        'description': 'Annual end-of-year celebration with live music, food trucks, and lawn games on Risman Plaza. Free for all KSU students.',
        'lat': 41.15253, 'lng': -81.34415,
        'buzz_reward': 8,
        'volunteer_hours': None,
        'event_date': ts(days_offset=6, hours_offset=12).isoformat(),
        'username': 'admin_kent', 'user_color': '#002664', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'kent',
        'type': 'event',
        'title': 'KSU Men\'s Basketball — MAC Tournament',
        'description': 'The Flashes are in the MAC Tournament semifinals. Student section doors open at 6 PM. Free student tickets at the box office.',
        'lat': 41.15630, 'lng': -81.34140,
        'buzz_reward': 10,
        'volunteer_hours': None,
        'event_date': ts(days_offset=1, hours_offset=19).isoformat(),
        'username': 'admin_kent', 'user_color': '#002664', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'kent',
        'type': 'volunteer',
        'title': 'May 4 Memorial Walk Setup',
        'description': 'Help set up chairs, signs, and displays for the annual May 4 commemoration on the Commons. Volunteers needed from 7–9 AM.',
        'lat': 41.15403, 'lng': -81.34520,
        'buzz_reward': 12,
        'volunteer_hours': 2,
        'event_date': ts(days_offset=5, hours_offset=7).isoformat(),
        'username': 'admin_kent', 'user_color': '#002664', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'kent',
        'type': 'volunteer',
        'title': 'KSU Food Drive — Student Center',
        'description': 'Help collect and sort non-perishables for the local Portage County food bank. Tables set up outside the Student Center.',
        'lat': 41.15481, 'lng': -81.34270,
        'buzz_reward': 10,
        'volunteer_hours': 2,
        'event_date': ts(days_offset=3, hours_offset=10).isoformat(),
        'username': 'admin_kent', 'user_color': '#002664', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'kent',
        'type': 'help',
        'title': 'Study Group — Data Structures (CS 33101)',
        'description': 'Meeting at the Science Library 3rd floor. Covering trees and graphs for the midterm. Bring a laptop.',
        'lat': 41.15350, 'lng': -81.34450,
        'buzz_reward': 5,
        'volunteer_hours': None,
        'event_date': ts(days_offset=1, hours_offset=16).isoformat(),
        'username': 'admin_kent', 'user_color': '#002664', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'kent',
        'type': 'help',
        'title': 'Lost: Blue North Face Jacket',
        'description': 'Left a blue North Face jacket (size M, no hood) at the Student Center Starbucks on Thursday morning. If you find it please reach out!',
        'lat': 41.15481, 'lng': -81.34270,
        'buzz_reward': 8,
        'volunteer_hours': None,
        'event_date': None,
        'username': 'admin_kent', 'user_color': '#002664', 'avatar_model': '/models/red.glb',
    },

    # ── OHIO STATE UNIVERSITY ─────────────────────────────────────────────────
    {
        'university_id': 'osu',
        'type': 'event',
        'title': 'OSU Undergraduate Research Symposium',
        'description': 'Students present original research across all disciplines. Posters and oral presentations in the Ohio Union Grand Ballroom.',
        'lat': 40.00035, 'lng': -83.01430,
        'buzz_reward': 10,
        'volunteer_hours': None,
        'event_date': ts(days_offset=4, hours_offset=9).isoformat(),
        'username': 'admin_osu', 'user_color': '#BB0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'osu',
        'type': 'event',
        'title': 'Buckeye Career Expo — Thompson Library',
        'description': 'Spring career fair for STEM students. 90+ companies including Google, Nationwide, Honda, and Battelle attending.',
        'lat': 40.00230, 'lng': -83.01110,
        'buzz_reward': 12,
        'volunteer_hours': None,
        'event_date': ts(days_offset=3, hours_offset=10).isoformat(),
        'username': 'admin_osu', 'user_color': '#BB0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'osu',
        'type': 'event',
        'title': 'Spring Commencement Watch Party',
        'description': 'Can\'t get into the Shoe? Watch the ceremony live on the big screen at Ohio Union. Snacks provided by Student Life.',
        'lat': 40.00070, 'lng': -83.01660,
        'buzz_reward': 5,
        'volunteer_hours': None,
        'event_date': ts(days_offset=7, hours_offset=14).isoformat(),
        'username': 'admin_osu', 'user_color': '#BB0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'osu',
        'type': 'volunteer',
        'title': 'Habitat for Humanity Build Day',
        'description': 'OSU\'s Habitat chapter is building homes in Columbus this Saturday. No experience needed — just show up and work hard. Buses leave at 7 AM.',
        'lat': 40.00070, 'lng': -83.01660,
        'buzz_reward': 20,
        'volunteer_hours': 4,
        'event_date': ts(days_offset=2, hours_offset=7).isoformat(),
        'username': 'admin_osu', 'user_color': '#BB0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'osu',
        'type': 'volunteer',
        'title': 'STEM Mentoring at Linden Elementary',
        'description': 'Help mentor K–5 students in hands-on science activities. Organized by OSU\'s STEM Outreach program. Transportation provided.',
        'lat': 40.00230, 'lng': -83.01110,
        'buzz_reward': 15,
        'volunteer_hours': 3,
        'event_date': ts(days_offset=5, hours_offset=13).isoformat(),
        'username': 'admin_osu', 'user_color': '#BB0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'osu',
        'type': 'help',
        'title': 'Physics 1250 Exam Prep Group',
        'description': 'Forming a study group for Physics 1250 covering chapters 12–17. Meeting at Smith Lab room 1005. Snacks will be there.',
        'lat': 40.00400, 'lng': -83.01200,
        'buzz_reward': 5,
        'volunteer_hours': None,
        'event_date': ts(days_offset=1, hours_offset=17).isoformat(),
        'username': 'admin_osu', 'user_color': '#BB0000', 'avatar_model': '/models/red.glb',
    },
    {
        'university_id': 'osu',
        'type': 'help',
        'title': 'Looking for a Roommate — Fall 2026',
        'description': 'Searching for a clean, respectful roommate for an off-campus 2BR apartment near Lane Ave. Rent is $550/mo each. Message me!',
        'lat': 40.00035, 'lng': -83.01430,
        'buzz_reward': 4,
        'volunteer_hours': None,
        'event_date': None,
        'username': 'admin_osu', 'user_color': '#BB0000', 'avatar_model': '/models/red.glb',
    },
]

# ── Seed ──────────────────────────────────────────────────────────────────────

def seed():
    print(f'Seeding {len(PINS)} demo pins...\n')
    counts = {}

    for pin in PINS:
        uni = pin['university_id']
        doc_data = {
            'user_id':          'system',
            'username':         pin['username'],
            'user_color':       pin['user_color'],
            'avatar_model':     pin['avatar_model'],
            'type':             pin['type'],
            'title':            pin['title'],
            'description':      pin['description'],
            'buzz_reward':      pin['buzz_reward'],
            'volunteer_hours':  pin['volunteer_hours'],
            'lat':              pin['lat'],
            'lng':              pin['lng'],
            'status':           'active',
            'university_id':    uni,
            'event_date':       pin['event_date'],
            'participant_count': 0,
            'is_seed':          False,
            'created_at':       now,
        }
        ref = db.collection('pins').document()
        ref.set(doc_data)
        counts[uni] = counts.get(uni, 0) + 1
        print(f'  OK [{uni.upper():4s}] {pin["type"]:10s}  {pin["title"]}')

    print(f'\nDone. Summary:')
    for uni, count in sorted(counts.items()):
        print(f'  {uni.upper():10s} — {count} pins')

if __name__ == '__main__':
    seed()
