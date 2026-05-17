# Emtihaan - AI Interview Practice Platform

A production-ready, full-stack platform designed for adaptive and immersive interview practice. Built with Next.js 14, Node.js, Express, TypeScript, and Prisma ORM.

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
* **Framework**: Next.js 14 (React 18)
* **Styling & UI**: TailwindCSS, ShadCN UI, Radix UI, Framer Motion
* **State & Data**: React Hooks, Axios for API communication

### **Backend Server**
* **Runtime & Framework**: Node.js, Express.js (TypeScript)
* **Authentication**: JSON Web Tokens (JWT) & bcryptjs
* **Database & ORM**: SQLite managed via Prisma ORM (`@prisma/client`)

---

## 📂 Project Structure

```
d:\Web-Dev\AI-Interview-Platform\
├── client/                     # Next.js 14 Frontend Application
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
* Node.js (v18 or higher recommended)
* npm or yarn

### 1. Backend Setup

The backend handles authentication, session tracking, adaptive logic, and SQLite database interactions.

```bash
cd server
npm install

# Run database migrations and generate Prisma client
npx prisma db push

# Start the development server (runs on http://localhost:4000)
npm run start
```

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
* `Session`: Represents an active or completed interview session, tracking the domain, difficulty rating, time limits, lifeline usage, and final calculated scores.
* `Attempt`: Tracks individual question attempts within a session, including question content, user selections, time taken, difficulty levels, and correctness.

---

## 🌐 Core API Endpoints

### Authentication (`/api/auth`)
* `POST /api/auth/register` - Register a new candidate account.
* `POST /api/auth/login` - Authenticate and receive a JWT token.

### Interview Sessions (`/api/interview`)
* `POST /api/interview/start` - Initialize a new interview session.
* `GET /api/interview/:sessionId/next` - Fetch the next dynamically calibrated question using adaptive difficulty and focus mode logic.
* `POST /api/interview/:sessionId/submit` - Submit an answer and receive instant correctness verification and explanations.
* `POST /api/interview/:sessionId/lifeline/skip` - Consume the one-time lifeline to bypass a question.
* `POST /api/interview/:sessionId/end` - Terminate the session and finalize timestamps.
* `GET /api/interview/:sessionId/report` - Generate the post-session "Interview DNA" diagnostic report.

---

## 📄 License
This project is proprietary and intended for professional interview simulation and candidate evaluation.
