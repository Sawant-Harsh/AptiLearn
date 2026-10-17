# AptiLearn (MERN)

Adaptive learning and diagnostics platform: **React 18 + Vite + Tailwind** front end, **Node/Express** API,
**MongoDB** (or a zero-setup JSON file), **Socket.IO** real-time sync, **real AI** (Anthropic Claude),
**Google sign-in**, and **YouTube** lesson videos.

Two actors only: **Student** and **Admin**.

## Quick start

```bash
npm run setup          # installs server + client dependencies (Node 18+)
npm start              # builds the client and serves everything on http://localhost:5000
# or, for development with hot reload (client :3000, API :5000):
npm run dev
```

It runs immediately with no configuration: data is stored in `server/data/db.json`.
To switch on the real integrations, copy `server/.env.example` to `server/.env` and fill in the keys below.

### Admin login (the only admin)

| Email | Password |
|-------|----------|
| `admin@gmail.com` | `admin123` |

Not shown anywhere in the UI. Any other email/password on the Admin tab is rejected. Change it with
`ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env`.

## Turning on the real integrations (`server/.env`)

| Feature | Variable(s) | How |
|---|---|---|
| **AI assistant + AI question builder** | `ANTHROPIC_API_KEY` (optional `ANTHROPIC_MODEL`) | Key from console.anthropic.com. AptiBot answers anything; admin "Generate questions" writes real MCQs into the bank. Without a key both show a clear "AI is not configured" message. |
| **Google sign-in (account chooser)** | `GOOGLE_CLIENT_ID` | Google Cloud Console > APIs & Services > Credentials > OAuth client ID (Web). Add `http://localhost:5000` and `http://localhost:3000` as *Authorised JavaScript origins*. The server verifies the Google ID token. Students only. |
| **YouTube video per lesson** | `YOUTUBE_API_KEY` | Free YouTube Data API v3 key. For every lesson the server finds a real, embeddable video for that exact topic, caches it, and the player changes when you change lesson. Without a key, Python uses a verified freeCodeCamp video and other lessons show a "Search on YouTube" card. |
| **MongoDB** | `MONGODB_URI` (and `MONGODB_DB`) | e.g. `mongodb://127.0.0.1:27017` or an Atlas `mongodb+srv://` URI. Empty = JSON file. |

Also set `JWT_SECRET` to a long random string for any real deployment.

## What is where

**Student portal**
- Landing page (no AI chat for guests): course catalog with images, categories and search, selected-course panel, FAQ, footer.
- Sign in / create account with full validation (unknown email, wrong password, duplicate email). Fields start empty.
  Progress is saved per account, so logging out and back in restores everything. New accounts start at zero (streak 1).
- Choosing a course before login: you land on that course's Learning hub after signing in. No choice: you land on Courses.
- **Learning hub**: streak, live rank + XP, course completion, real YouTube lesson video, syllabus that ticks off as you finish, PDF notes (counts as reading), "Take a quick test" (topics + difficulty), FAQ, reviews.
- **Courses**: all courses; enrolled ones first with live completion; start any new course with its own diagnostic.
- **My progress**: every enrolled course with live completion, strong/weak topics, recommended lessons and videos for weak topics, quick test.
- **Rankings**: Indian-named student leaderboard including you, updating live.
- Account menu: My progress, My profile (edit/clear details, change password, delete account), Rankings, Log out. Notification bell receives admin messages instantly.
- **AptiBot** (floating, every signed-in page except during a diagnostic): real AI, any question.

**Admin portal** (Overview / Students / Question bank / Reports + profile drawer with Log out)
- Overview: one card per course. Click to open that course's page: metrics, diagnostic gradebook (search, status filter, at-risk filter, CSV export, per-student view, **send support message** straight to the student's notifications) and the **AI based question builder**.
- **Create New Course** (on every admin page): the course appears for all students immediately.
- Students page, Question bank (all questions incl. AI ones, live/hidden toggle; separate "Add to question bank" form, display only), Reports.
- All admin <-> student changes sync in real time over Socket.IO.

**XP / ranking**: diagnostic score + 20 per completed lesson + 5 per lesson notes read + 2 per correct quick-test answer.

## Layout

```
client/   React app (pages, components, context, real-time hooks)
server/   Express API, Socket.IO, DB adapter (JSON file or MongoDB), AI + YouTube services, seed data
server/src/selftest.js   `npm test`: 36 end-to-end API checks
```
