
BuzzOnCampus
The Living Map of Campus Life
Design Document, Technical Specification & Team Roadmap

Kent State University Hackathon
March 28, 10AM — March 29, 10AM
Target Build Time: 18–20 Hours
Team: Shafi · Tirsan · Sumaiya

Version 2.0   |   Internal Use Only
 
1. Project Overview

1.1 What is BuzzOnCampus?
BuzzOnCampus is a campus lifestyle and community platform built for university students. It centers around a live interactive 3D map that shows everything happening around campus in real time — events, volunteer opportunities, help requests, and local business highlights. Students connect, contribute, and earn Buzz Points for participating in their community.

The One-Line Pitch
A living map of campus life — discover events, volunteer, help each other, and earn rewards, all in one place built for your university.

1.2 Core Problem We Solve
•	Students don't know what's happening around campus unless they happen to see a flyer
•	Volunteer opportunities are scattered and hard to track for class credit
•	There's no central way to ask for or offer help within a campus community
•	Local businesses near campus have no direct channel to reach students

1.3 How It Works
Step	What Happens	Result
Sign Up	Student registers with .edu email, picks university and avatar color	Gets 20 Buzz Points to start
Explore Map	Opens the live 3D campus map — sees pins for events, volunteering, help requests	Discovers what is happening nearby
Post or Join	Creates an event, posts a help request, or signs up to volunteer	Pin appears live on map for others
Participate	Attends event, completes volunteer shift, helps a fellow student	Earns Buzz Points on completion
Redeem	Spends Buzz Points on campus perks, logs volunteer hours for class credit	Real world value unlocked

1.4 What Makes It Different
•	The 3D live map is the entire UX — not a feed with a map added, but a map-first experience
•	Buzz Points directly convert to verified volunteer hours for class credit
•	University-locked with .edu email — keeps it authentic and campus-specific
•	Everything is real-time — new pins appear instantly for everyone on the map

 
2. Feature Set

Scope Philosophy
We are building 3 must-have features perfectly rather than 6 features half-finished. Every feature below has been chosen because it can be completed in 18-20 hours AND demonstrated live to judges.

2.1 Must Have — Red Priority
Feature	Description
Auth + Onboarding	Sign up with .edu email, pick university from dropdown, choose avatar color, receive 20 Buzz Points
Live 3D Map	Mapbox map with 3D buildings toggle, real-time pins for all content types, city centered on chosen university
Pin Types on Map	Events (blue), Volunteering (green), Help Requests (yellow), Local Businesses (purple) — each category has distinct color
Post a Pin	Create any pin type — title, description, date/time, category, location on map
Join or Accept	Click any pin to see details, join an event, sign up to volunteer, or accept a help request
Buzz Points Engine	Earn points on completion, balance shown in navbar, transfers atomically in database

2.2 Should Have — Yellow Priority
Feature	Description
Campus Feed	Vertical social feed alongside the map showing recent activity — new events, completed helps, new volunteers
Category Filter	Toggle buttons above map to show/hide pin types — Events, Volunteering, Help, Businesses
Local Business Pins	Static business pins seeded in DB showing name, deal, distance from campus

2.3 Nice to Have — Green Priority (Only if time allows)
Feature	Description
Volunteer Hours Tracker	Profile page showing total volunteer hours logged from completed volunteer pins
User Profile Page	Avatar, username, Buzz Points balance, pins created, events attended
Notifications	Toast notification when someone joins your event or accepts your help request

2.4 Cut Completely — Do Not Build
•	Rating or reputation system
•	Leaderboard
•	In-app chat or messaging
•	SSN or I-20 verification
•	Partner redemption portal
•	Push notifications

 
3. Technology Stack

3.1 Frontend — Shafi
Technology	Purpose
React + Vite	Component architecture, fast dev server, familiar to Shafi
react-map-gl v7	Mapbox GL wrapper for React — map, markers, popups, layers
Mapbox GL JS	WebGL map rendering, 3D buildings, smooth interactions
@react-three/fiber	React wrapper for Three.js — renders 3D avatar models
@react-three/drei	useGLTF hook for loading .glb Blender models
Tailwind CSS	Fast utility-first styling — essential for hackathon speed
Zustand	Lightweight global state — auth, Buzz balance, map filters
Socket.io-client	WebSocket client for real-time pin updates
Axios	HTTP client for API calls
React Router v6	Client-side routing

3.2 Backend — Tirsan + Sumaiya
Technology	Purpose
FastAPI (Python)	Async REST API + WebSocket server — team has prior experience
PostgreSQL (AWS RDS)	Relational DB for users, pins, Buzz transactions
SQLAlchemy + Alembic	ORM and database migrations
JWT (PyJWT)	Stateless auth tokens — access + refresh pattern
Bcrypt	Password hashing
Pydantic v2	Request and response validation
Boto3	AWS SDK for SES email and S3
WebSockets (FastAPI)	Real-time push of new pins to all connected map clients

3.3 AWS Infrastructure
Service	Usage
App Runner	FastAPI backend deployment — auto-scaling, zero server management
S3 + CloudFront	React frontend hosting with global CDN
RDS (PostgreSQL)	Managed database with automated backups
SES	Email verification on .edu signup
Secrets Manager	Store Mapbox token, DB credentials, JWT secret securely

 
4. Team Roles & Responsibilities

Team of 3
Each person has a clear primary lane. Tirsan owns backend architecture. Sumaiya bridges frontend and backend, shifting more toward backend with Raya's departure. When anyone gets blocked, the nearest available teammate steps in.

Shafi — Frontend Lead
Primary Focus
Map interface, 3D avatars, UI components, overall visual experience. The face of the product.

•	Set up React + Vite project, Tailwind, React Router, Zustand store
•	Integrate Mapbox — map rendering, 3D buildings toggle, viewport controls
•	Build 3D avatar marker system using React Three Fiber and .glb models
•	Implement pin rendering on map by category with color coding
•	Build click-to-open pin detail sidebar component
•	Build Post Pin modal — category, title, description, map location picker
•	Buzz Points balance display in navbar with animated counter
•	Category filter toggle buttons on map
•	Landing page hero section
•	Connect all frontend components to backend API endpoints
•	Seed demo data visually — make sure map looks alive for demo

Tirsan — Backend Lead
Primary Focus
API architecture, database schema, Buzz Points engine, AWS deployment. The engine of the product.

•	FastAPI project setup, folder structure, config, DB connection
•	PostgreSQL schema design and Alembic migrations
•	Auth endpoints — register with .edu validation, login, JWT tokens
•	Pin CRUD endpoints — create, read, update, delete all pin types
•	WebSocket server — broadcast new pins to all connected clients in real time
•	Buzz Points engine — atomic transfers, balance tracking, transaction log
•	Join and completion endpoints — trigger Buzz Point transfers
•	SES email verification on signup
•	AWS App Runner deployment of FastAPI backend
•	RDS setup and database seeding with demo data
•	Secrets Manager configuration for all API keys

Sumaiya — Full-Stack Bridge & Backend Support
Primary Focus
Connects frontend to backend AND absorbs Raya's backend tasks. Builds forms and flows on frontend, handles schemas, seed data, and business pins on backend. The team's most flexible member.

•	Build signup and login forms — connect to auth endpoints
•	Auth context — persist JWT in Zustand, protect routes
•	Post Pin form logic — validate inputs, call create pin API, update map
•	Pin detail sidebar data — fetch pin details, join/accept button logic
•	Campus social feed component — fetch and display recent activity
•	End-to-end testing of full user flows — signup to pin completion
•	University dropdown on signup with coordinates mapping
•	Write all Pydantic schemas for request and response models
•	Seed local business data — 10 businesses per university, static purple pins
•	Demo data coordination — seed 15+ realistic pins before the demo
•	Help Tirsan with any backend endpoint logic when needed
•	Help Shafi with any UI component when needed

 
5. Database Schema

Table	Key Fields	Description	Relations
users	id, email, university, buzz_balance, color, avatar_url, created_at	Core student account — .edu email required, university sets map center	→ pins, participations, transactions
pins	id, user_id, type, title, description, buzz_reward, lat, lng, status, event_date	Any map pin — event, volunteer, help request, or business	→ users, participations
participations	id, pin_id, user_id, status, joined_at	A student joining an event, volunteering, or accepting help	→ pins, users
transactions	id, from_id, to_id, amount, pin_id, created_at	Buzz Points movement audit log — every transfer recorded	→ users, pins
universities	id, name, lat, lng, domain	Supported universities with coordinates for map centering	→ users
businesses	id, name, description, deal, lat, lng, university_id	Local businesses near campus — seeded static data	→ universities

Pin Types
Type Value	Meaning
event	Club meetup, social gathering, campus activity — blue pin
volunteer	Volunteer opportunity earning Buzz Points and class hours — green pin
help	Help request from a student needing assistance — yellow pin
business	Local business highlight with student deal — purple pin

 
6. API Reference

6.1 Auth
Method + Endpoint	Description
POST /auth/register	Register with .edu email, university, color → returns JWT + user
POST /auth/login	Email + password → returns JWT tokens
POST /auth/refresh	Refresh token → new access token
GET /auth/me	Bearer token → current user profile and Buzz balance

6.2 Pins
Method + Endpoint	Description
GET /pins	List active pins — query: university_id, type, radius_km
POST /pins	Create new pin — requires auth and pin type
GET /pins/{id}	Get single pin with participation count
DELETE /pins/{id}	Cancel pin — creator only
POST /pins/{id}/join	Join event or volunteer opportunity
POST /pins/{id}/accept	Accept help request — help type only
POST /pins/{id}/complete	Mark complete — triggers Buzz Points transfer

6.3 Users + Buzz
Method + Endpoint	Description
GET /users/me/balance	Returns available Buzz Points balance
GET /users/me/pins	List of pins created by current user
GET /users/me/participations	List of events joined and volunteer shifts
GET /universities	List of supported universities with coordinates
GET /businesses	List of local business pins by university

6.4 WebSocket Events
Event	Direction + Payload
new_pin	Server → All: {pin_id, type, lat, lng, title, user_color} — new pin on map
pin_updated	Server → All: {pin_id, participant_count} — someone joined
pin_completed	Server → All: {pin_id} — remove from map
pin_cancelled	Server → All: {pin_id} — remove from map
buzz_update	Server → User: {new_balance} — update navbar balance
user_connected	Client → Server: {user_id, university_id} — join university room

 
7. Full 18–20 Hour Team Roadmap

How to Read This
Each block is a time range. All 3 team members work in parallel. Shafi owns frontend, Tirsan owns backend architecture, Sumaiya bridges both and handles Raya's former tasks. The critical path is: Auth → Map with Pins → Post Pin → Join and Complete → Buzz Transfer.

Phase 1 — Setup & Foundation (Hours 0–2)
Goal
Everyone has a running project, shared repo, and agreed API contracts before writing any feature code.

Time	Shafi (Frontend)	Tirsan (Backend)	Sumaiya (Bridge + Backend)
Hr 0–1	Create Vite + React project, install all dependencies (react-map-gl, R3F, Tailwind, Zustand, Axios), set up React Router with page stubs	Create FastAPI project structure, set up SQLAlchemy, connect to RDS, write all DB models and Alembic migrations	Set up shared GitHub repo, create .env.example files, document API contracts in shared doc, write all Pydantic schemas for request and response models
Hr 1–2	Get Mapbox map rendering fullscreen with correct university centering, test 2D/3D toggle, confirm .env token loading	Write and test auth endpoints (register + login + me), implement .edu email validation, JWT generation	Build signup and login form UI, wire up to auth endpoints, test full signup flow, seed universities table with coordinates and businesses table with 10 local entries


Phase 2 — Core Map & Pins (Hours 2–7)
Goal
The map shows live pins. Clicking a pin opens a detail panel. This is the hero feature — do not rush it.

Time	Shafi (Frontend)	Tirsan (Backend)	Sumaiya (Bridge + Backend)
Hr 2–4	Load 3D avatar .glb model on map using React Three Fiber, implement color override at runtime from user's chosen color, render rotating avatar marker at correct lat/lng	Build all pin CRUD endpoints (GET /pins, POST /pins, GET /pins/{id}), implement WebSocket server with university rooms, broadcast new_pin event on creation	Connect frontend to GET /pins on map load — render existing pins from DB as markers on map, implement pin color by type (blue/green/yellow/purple), write participation endpoints
Hr 4–6	Build pin detail sidebar — slides in from right on marker click, shows title, description, type, creator, buzz reward, join/accept button	Implement Buzz Points engine — atomic transfer on pin completion, balance update, broadcast buzz_update WebSocket event to user	Wire up join and accept buttons to backend endpoints, handle loading and success states, help Tirsan debug any DB transaction issues
Hr 6–7	Real-time map updates — consume WebSocket events to add new pins without page reload, animate pin appearance	Deploy FastAPI to AWS App Runner, confirm WebSocket works on production URL, set up Secrets Manager and confirm RDS connected	Smoke test full flow end to end: signup, see map, post a pin, see it appear live in another browser tab, confirm all env variables set correctly


Phase 3 — Post Pin & Full Loop (Hours 7–11)
Goal
A user can post any pin type and the full loop works: post → appears on map → join/accept → complete → Buzz Points transfer.

Time	Shafi (Frontend)	Tirsan (Backend)	Sumaiya (Bridge + Backend)
Hr 7–9	Build Post Pin modal — step 1 pick category, step 2 fill details and Buzz reward, step 3 click location on map to set lat/lng, submit creates pin via API	Fix any bugs found during smoke test, ensure pin completion correctly transfers Buzz Points atomically with no edge cases	Wire Post Pin modal submit to POST /pins endpoint, confirm new pin appears on map immediately via WebSocket, seed local business pins as static purple markers from DB
Hr 9–11	Category filter toggle buttons above map — clicking Event/Volunteer/Help/Business shows or hides those pin types on map	Build campus feed endpoint — GET /feed returns recent activity sorted by time (new pins, completions, joins)	Build campus social feed UI component — vertical list alongside map showing recent activity, test complete Buzz Points flow end to end in production


Phase 4 — Polish & Nice to Have (Hours 11–15)
Goal
The core product works. Now make it look and feel great. Add nice-to-have features only if core is solid.

Time	Shafi (Frontend)	Tirsan (Backend)	Sumaiya (Bridge + Backend)
Hr 11–13	Landing page — hero section with tagline, animated stats (total pins, students, volunteer hours), sign up CTA, clean navbar	Build volunteer hours summary — count completed volunteer pins per user, one SQL query, no separate complex endpoint needed	Build user profile page — avatar in chosen color, username, university, Buzz balance, pins created, volunteer hours total
Hr 13–15	Animated Buzz Points counter in navbar — counts up or down when balance changes via WebSocket, coin icon next to balance	Performance check on GET /pins — add DB index on university_id and status columns for fast map load	Toast notification component — shows when someone joins your pin or help request is accepted, handle all remaining edge cases


Phase 5 — Deployment & Demo Prep (Hours 15–18)
Goal
Everything deployed, demo rehearsed, seed data looks great. No surprises during the actual presentation.

Time	Shafi (Frontend)	Tirsan (Backend)	Sumaiya (Bridge + Backend)
Hr 15–17	Deploy frontend to S3 + CloudFront, update all API URLs to production App Runner URL, test everything on live production URLs	Final production deployment check — confirm WebSockets stable, RDS connections healthy, SES email delivery working	Full end-to-end test on production URLs — signup, post pin, join, complete, Buzz transfer — confirm everything works live
Hr 17–18	Final UI polish — fix any spacing or styling issues, make sure map looks visually impressive with all seed pins visible	Monitor application logs, fix any last production bugs, confirm WebSocket reconnection works if connection drops	Seed production DB with realistic demo data: 15+ pins of mixed types, 10 users with different avatar colors, rehearse 3-minute demo script with team

Buffer Hours 18–20
Use these hours for rest, unexpected bugs, or demo rehearsal. Do NOT use them to add new features. A well-rested team presents better than a team that coded for 20 straight hours.

 
8. Demo Plan

The Golden Rule
Show the full loop live in under 3 minutes. Judges remember what they SEE, not what you describe. The map should look alive with pins the moment you open it.

8.1 Pre-Demo Setup
•	Have two browser windows open side by side — one as User A (requester), one as User B (helper)
•	Production URL loaded and map showing at least 10 seeded pins in different colors
•	User A and User B accounts pre-logged in — no typing passwords during demo
•	Map in 3D mode with buildings visible for maximum visual impact

8.2 Demo Script — 3 Minutes
Time	Action	What Judges See
0:00–0:20	Open homepage, explain BuzzOnCampus in one sentence, show the live map with 10+ pins	Visually impressive 3D map full of activity
0:20–0:40	Sign up as new user with .edu email, pick university, choose teal avatar color	Onboarding flow, university locking, Buzz Points concept
0:40–1:10	Post a volunteer opportunity pin — place it on the campus map, set 20 Buzz reward	Pin appears LIVE on the second browser window in real time
1:10–1:40	Switch to User B window, click the new volunteer pin, read details, click Sign Up	Map interaction, pin detail sidebar, real-time participant count updates
1:40–2:10	Both users mark as complete — show Buzz Points transfer in navbar counter animation	Buzz economy working, animated balance update
2:10–2:40	Show category filters — toggle to Events only, then Volunteering only, then all	Map filtering, different pin colors by type
2:40–3:00	Show campus feed, mention volunteer hours tracking, close with mission statement	Social layer, real-world university value proposition

8.3 Key Talking Points for Judges
•	Built for THIS university — .edu email lock, university-specific map centering
•	Buzz Points directly convert to verified volunteer class credit hours
•	Real-time WebSocket architecture — no refreshing, everything is live
•	Full AWS stack — App Runner, S3, CloudFront, RDS, SES — production ready
•	3D avatar system built with Three.js and custom Blender models

8.4 Risk Mitigation
Risk	Backup Plan
WebSockets fail on demo WiFi	Fall back to 5-second polling — same visual result
3D avatars lag on demo machine	Switch to flat colored circle markers — still looks great
AWS goes down during demo	Have localhost version running as immediate fallback
Map looks empty	Pre-seed 15+ pins before the demo — never show an empty map
Team member gets blocked	Sumaiya moves to whoever needs help — she is the safety net

 
9. Quick Reference Card

9.1 Critical Path — If These Work You Win
The Non-Negotiables
1. Auth working end to end  →  2. Map shows pins from DB  →  3. Post a pin and it appears live  →  4. Join and complete a pin  →  5. Buzz Points transfer correctly. Build these 5 things first. Everything else is bonus.

9.2 Project Structure
Path	Contents
frontend/src/components/map/	Map, AvatarMarker, PinMarker, PinDetailSidebar, FilterButtons
frontend/src/components/auth/	SignupForm, LoginForm, AuthContext
frontend/src/components/pins/	PostPinModal, PinCard, PinFeed
frontend/src/store/	useAuthStore, useMapStore, useBuzzStore
backend/app/routers/	auth.py, pins.py, users.py, websocket.py
backend/app/models/	user.py, pin.py, participation.py, transaction.py
backend/app/services/	buzz_engine.py, email_service.py
backend/alembic/versions/	Database migration files

9.3 Environment Variables
Frontend .env
Variable	Value
VITE_MAPBOX_TOKEN	pk.your_mapbox_public_token
VITE_API_URL	https://your-app-runner-url or http://localhost:8000
VITE_WS_URL	wss://your-app-runner-url/ws or ws://localhost:8000/ws

Backend .env
Variable	Value
DATABASE_URL	postgresql://user:password@rds-endpoint:5432/buzzoncampus
JWT_SECRET	long random secret string
JWT_ALGORITHM	HS256
AWS_REGION	us-east-1
AWS_SES_FROM_EMAIL	noreply@yourdomain.com

9.4 Pin Color Reference
Pin Type	Color on Map
Event	Blue — social gatherings, club meetups, campus activities
Volunteer	Green — opportunities earning Buzz Points and class hours
Help Request	Yellow — student asking for assistance from community
Business	Purple — local business with student deal or highlight

Final Note to the Team
You have already proven the hardest part works — the 3D map and avatar system is running. The rest is forms, API calls, and good teamwork. Trust the roadmap, communicate when blocked, and get some sleep before the demo. You got this.

