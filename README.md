# Emtihaan - AI Interview Practice Platform

A production-ready, full-stack platform for adaptive interview practice.
Built with Next.js, Node.js, and Prisma.

## Quick Start

### 1. Backend Setup
The backend handles API requests, authentication, and the connection to the SQLite database.

```bash
cd server
npm install
npx prisma db push
npx nodemon src/app.ts
```
Server will start on `http://localhost:4000`.

### 2. Frontend Setup
The frontend is a Next.js application.

```bash
cd client
npm install
npm run dev
```
Client will start on `http://localhost:3000`.

## Features
- **Adaptive Difficulty**: Questions get harder as you answer correctly.
- **Context Locking**: Skips trigger a "Focus Mode" on that specific topic.
- **Interview DNA**: Detailed report with AI-driven insights.
- **Mock AI**: Includes a robust simulation of AI question generation (free to run).

## Technologies
- **Frontend**: Next.js 14, TailwindCSS, ShadCN UI, Axios.
- **Backend**: Express, TypeScript, Prisma (SQLite).
- **Auth**: JWT.
