# Emtihaan - AI Interview Practice Platform

A production-ready, full-stack platform designed for adaptive and immersive interview practice. Built with Next.js 16, Node.js, Express, TypeScript, and Prisma ORM.

---

## 🚀 Key Features

* **Adaptive Difficulty Engine**: Dynamically scales question difficulty (Levels 1–5) based on user performance. Correct answers ramp up the challenge, while incorrect answers scale it back to ensure optimal skill calibration.
* **Context Locking (Focus Mode)**: Skipping a question triggers a targeted "Focus Mode" on that specific topic in subsequent questions, ensuring candidates master weak areas.
* **Lifeline Protection**: Offers a one-time lifeline skip per session, allowing candidates to bypass extremely difficult questions without hurting their adaptive progression or triggering focus mode.
* **Interview DNA & Diagnostic Reports**: Generates a comprehensive post-session analysis featuring accuracy percentages, a visual topic-by-topic Skill Matrix, AI-driven performance insights, and detailed explanations for missed questions.
* **Mock AI Simulation Engine**: Includes a robust, cost-free question simulation engine with curated banks across IT, Finance, HR, and Marketing domains.
* **Premium Interactive UI**: Crafted with TailwindCSS, Framer Motion, and ShadCN UI, featuring dynamic gauges (Speedometer Difficulty), responsive layouts, and smooth transitions.

---

## 🛠️ Technology Stack & Architecture

### **Frontend Client**
* **Framework**: Next.js 16 (React 19)
* **Styling & UI**: TailwindCSS, ShadCN UI, Radix UI, Framer Motion
* **State & Data**: React Hooks, Axios for API communication

### **Backend Server**
* **Runtime & Framework**: Node.js, Express.js (TypeScript)
* **Authentication**: short-lived JWT access tokens + rotating refresh tokens (httpOnly cookies, reuse detection) & bcryptjs
* **Database & ORM**: SQLite managed via Prisma ORM (`@prisma/client`)

---

## 📂 Project Structure

```
d:\Web-Dev\AI-Interview-Platform\
├── client/                     # Next.js 16 Frontend Application
│   ├── src/app/                # App router pages (dashboard, interview, report, auth)
│   ├── src/components/         # Reusable UI components (SpeedometerDifficulty, QuickActions)
│   └── src/lib/                # Client utility functions & Axios API configuration
└── server/                     # Node.js / Express Backend Server
    ├── prisma/                 # Prisma schema & SQLite database
    └── src/
        ├── routes/             # API route definitions (auth.routes, interview.routes)
        ├── services/           # Business logic (ai.service, adaptive.service)
        └── utils/              # Helper utilities (auth token verification)
```

---

## 🚦 Getting Started

### Prerequisites
* Node.js 20.9 or higher (required by Next.js 16)
* npm or yarn

### 1. Backend Setup

The backend handles authentication, session tracking, adaptive logic, and SQLite database interactions.

```bash
cd server
npm install

# Create server/.env (see "Environment variables" below), then apply migrations
npx prisma migrate deploy

# Start the development server with auto-reload (http://localhost:4000)
npm run dev

# Production: compile, then run the compiled server
npm run build && npm start

# Run the tests
npm test
```

#### Environment variables (`server/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Prisma connection string, e.g. `file:./dev.db` |
| `JWT_SECRET` | yes | Signs session tokens. The server refuses to start without it. |
| `GEMINI_API_KEY` | no | Enables AI-generated questions and written-answer grading. Without it the built-in question bank is used and written-answer mode is unavailable. |
| `GEMINI_MODEL` | no | Defaults to `gemini-2.5-flash` |
| `CLIENT_ORIGIN` | no | Allowed CORS origin(s), comma separated. Defaults to `http://localhost:3000` |
| `COOKIE_SAMESITE` | no | `lax` (default). Use `none` (HTTPS only) if the client and API are on different sites. |
| `PORT` | no | Defaults to `4000` |

#### How sessions work

* Login sets two httpOnly cookies: a **15-minute access token** (`token`, sent to every API route) and a **30-day refresh token** (`refresh_token`, only sent to `/api/auth/*`).
* When the access token expires the client calls `POST /api/auth/refresh` automatically and replays the failed request (`client/src/lib/api.ts`).
* Refresh tokens are random, stored **hashed**, and **rotated on every use**. If an already-used token is replayed (outside a 10-second grace window for multi-tab races), the whole login family is revoked.
* The 30-day limit is absolute: rotation does not extend it, so users sign in again after 30 days.
* `POST /api/auth/logout` revokes the refresh token server-side. An access token already issued stays valid until it expires (max 15 minutes).

> **Moving to Postgres:** change `provider` to `postgresql` in `schema.prisma`, point `DATABASE_URL` at your database, delete `prisma/migrations`, then run `npx prisma migrate dev --name init` to generate a Postgres baseline.

### 2. Frontend Setup

The frontend provides the interactive candidate portal and post-session reporting dashboard.

```bash
cd client
npm install

# Start the Next.js development server (runs on http://localhost:3000)
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to access Emtihaan.

---

## 🗄️ Database Schema Overview

The database is structured around three primary models in `server/prisma/schema.prisma`:

* `User`: Stores authentication credentials and links to interview sessions.
* `Session`: Represents an active or completed interview session, tracking the domain, format (`MCQ` or `OPEN`), difficulty rating, time limits, lifeline usage, and final calculated scores.
* `Attempt`: Tracks individual question attempts within a session, including question content, user selections or written answers, AI grade and feedback (written mode), time taken, difficulty levels, and correctness.

---

## 🌐 Core API Endpoints

### Authentication (`/api/auth`)
* `POST /api/auth/signup` - Register a new candidate account (sets the session cookie).
* `POST /api/auth/login` - Authenticate (sets the session cookie).
* `POST /api/auth/refresh` - Rotate the refresh token and issue a new access token.
* `GET /api/auth/me` - Current user.
* `POST /api/auth/logout` - Revoke the refresh token and clear the cookies.

### Interview Sessions (`/api/interview`)
* `POST /api/interview/start` - Initialize a new interview session (`mode`: `MCQ` or `OPEN`).
* `GET /api/interview/sessions?page=1&limit=20` - Paginated session list.
* `GET /api/interview/history` - Dashboard stats (totals, accuracy, streak).
* `GET /api/interview/:sessionId/next` - Fetch the next dynamically calibrated question using adaptive difficulty and focus mode logic.
* `POST /api/interview/:sessionId/submit` - Submit an option (`selectedOption`) or a written answer (`answerText`, AI-graded 0–10) and receive correctness and explanations. Timing is enforced server-side.
* `POST /api/interview/:sessionId/lifeline/skip` - Consume the one-time lifeline to bypass a question.
* `POST /api/interview/:sessionId/end` - Terminate the session and finalize timestamps.
* `GET /api/interview/:sessionId/report` - Generate the post-session "Interview DNA" diagnostic report.

---

## 📄 License
This project is proprietary and intended for professional interview simulation and candidate evaluation.
