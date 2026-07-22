# EduAI — School Lab Platform

An adaptive, B2B education platform for Indian CBSE classrooms: gamified learning for Class 1–4 (Batch 1), NCERT foundations for Class 5–8 (Batch 2), and board-exam preparation for Class 9–10 (Batch 3). Includes portals for teachers, school admins, lab in-charges, and a super admin.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS 4 (`src/`) |
| Backend API | Node.js + Express + TypeScript (`api/`) |
| Database / Auth / Storage | Supabase (Postgres + pgvector, GoTrue, Storage) |
| AI | Cloud OpenAI-compatible provider (chat/grading) + local Ollama (embeddings), see `api/src/lib/ai.ts` |

## Prerequisites

- **Node.js** v18+ (v22 recommended)
- **Docker Desktop** (must be running — Supabase runs in containers)
- **Supabase CLI** (used via `npx supabase`, no global install needed)

## Running the app (local development)

You need **three** things running: Supabase (Docker), the backend API, and the frontend.

### 1. Start Supabase

```bash
# From the project root — starts Postgres, Auth, Storage, Studio in Docker
npx supabase start
```

First run downloads images and applies every migration in `supabase/migrations/` plus `supabase/seed.sql`. When it finishes it prints the local URLs and keys.

- Supabase API: http://127.0.0.1:54321
- Supabase Studio (DB admin UI): http://127.0.0.1:54323

### 2. Start the backend API

```bash
cd api
npm install        # first time only
npm run dev        # starts on http://localhost:4000
```

Requires `api/.env` (already present for local dev; see `.env.example` in the root for the full variable reference). Verify it's up:

```bash
curl http://localhost:4000/health
# → {"status":"ok", ...}
```

### 3. Start the frontend

```bash
# From the project root, in a separate terminal
npm install        # first time only
npm run dev        # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

> **Login fails with "Something went wrong — please try again"?**
> That means the frontend can't reach the backend — the API on port 4000 (step 2) isn't running.

### First-time database setup

If you're starting from a fresh database (`npx supabase db reset`), create the super admin:

```bash
cd api
npm run seed:super-admin
# → admin@eduai.local / ChangeMe-Now-1
```

Schools, admins, teachers, and students are then created through the app itself (Super Admin creates schools; School Admin imports teachers/students).

## Local test credentials

> ⚠️ **Local development only.** These accounts live in your local Supabase database and must never be reused in production. Change the super admin password after first login on any real deployment.

| Role | Email | Password | Lands on |
|---|---|---|---|
| Super Admin | `admin@eduai.local` | `ChangeMe-Now-1` | `/super-admin/schools` |
| School Admin | `e2e-admin@eduai.local` | `Admin-Demo-2026` | `/school-admin/dashboard` |
| Teacher (Mr. Rao) | `mr.rao.5d2a15@sps.delhi.01.eduai.local` | `Teacher-Demo-2026` | `/teacher/dashboard` |
| Student (Dev Kumar) | `dev.kumar.c43f1a@sps.delhi.01.eduai.local` | `2uBUAVW3` | student batch home |

The demo school code is **`SPS-DELHI-01`**.

**Class 1–4 PIN login:** young students don't type emails — they use the **CLASS 1–4 (PIN)** tab on the login page (school code → class → section → tap their name → 4-digit PIN). This only works while their teacher has a live class session running.

## Useful commands

```bash
# Frontend (project root)
npm run dev          # dev server
npm run build        # production build (tsc + vite)
npm run lint         # eslint

# Backend (api/)
npm run dev          # dev server with watch
npm run typecheck    # tsc --noEmit
npm run seed:super-admin                        # bootstrap first super admin
npm run seed:school-admin -- --school-code X    # CLI school-admin creation

# Database (project root)
npx supabase start   # start local stack
npx supabase stop    # stop it
npx supabase db reset  # wipe + re-run migrations + seed
```

## Project structure

- `src/` — React frontend (routes per portal: `batch1/2/3`, `teacher`, `school-admin`, `super-admin`, `lab-incharge`)
- `api/` — Express backend (controllers → services → Supabase)
- `supabase/` — database migrations and seed data
- `docker-compose.yml` — full production stack for a single school server

## Production deployment

`docker-compose.yml` in the root brings up the full self-hosted stack (Supabase, API, Ollama, Nginx serving the built frontend) on a single school server:

1. Copy `.env.example` → `.env` and fill in **strong** secrets and real API keys.
2. `npm run build` (produces `dist/` which Nginx serves).
3. `docker compose up -d`
4. First boot: `docker compose exec api npm run seed:super-admin -- --email you@school.com --password "Strong-Password-1"`

See `RAG_DEPLOYMENT_CHECKLIST.md` and `NCERT_RAG_PRODUCTION_PLAN.md` for the AI/RAG content-ingestion setup.
