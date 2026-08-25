# EduAI

An AI-powered K-12 learning platform for Indian schools (NCERT-grounded RAG tutor, exams, gamification, admin/teacher portals). React + Vite frontend, Express/TypeScript API, Supabase (Postgres + Auth + Storage), local Ollama for embeddings and (optionally) chat.

## Prerequisites

- **Node.js** 20+ and npm
- **Docker Desktop** — runs the local Supabase stack (Postgres, Auth, Storage, Studio)
- **Ollama** — running locally at `http://127.0.0.1:11434` with `mxbai-embed-large` pulled (embeddings always run locally; chat/vision can use it too, or a cloud API — see `api/.env`)
- **Supabase CLI** — invoked via `npx supabase`, no global install needed

## First-time setup

```bash
npm install
cd api && npm install && cd ..
```

Env files already live in the repo for local dev:
- `.env` (frontend — `VITE_API_URL`)
- `api/.env` (API — Supabase local keys, `PORT=4000`, Ollama config)

If either is missing, copy the matching `.env.example` and fill in the values (for `api/.env`, the Supabase keys come from `npx supabase status` after starting it below).

## Running the app

Five things need to be running. Open a separate terminal for each of the three `npm run dev*` commands (Docker Desktop and Ollama run as background apps/services).

**1. Docker Desktop** — make sure it's running (Supabase runs in containers).

**2. Local Supabase** (from the repo root):
```bash
npx supabase start
```
This prints the local `API_URL`, `SERVICE_ROLE_KEY`, `STUDIO_URL`, etc. First run applies all migrations automatically.

If the stack was **already running** from a previous session (`npx supabase status` shows containers `Up`), new migration files added since then are *not* applied automatically — `supabase start` only runs migrations while creating the containers. Apply anything pending with:
```bash
npx supabase migration up
```
This is safe to run any time — it only applies migrations not yet recorded as applied, and never wipes data (unlike `supabase db reset`, which rebuilds the database from scratch and is only for when you want a clean slate).

**3. Redis** (shared tutor slots when many schools ask at once):
```bash
docker run -d --name eduai-redis -p 6379:6379 redis:7.4-alpine
```
Set `REDIS_URL=redis://127.0.0.1:6379` in `api/.env`. The API still boots without it (per-process fallback).

**4. The API** (in `api/`):
```bash
cd api
npm run dev
```
→ listens on **http://localhost:4000**

**5. The background worker** (in `api/`, separate terminal):
```bash
cd api
npm run dev:worker
```
→ health on **http://localhost:4100**

This runs NCERT PDF ingestion (RAG chunking/embedding), the PDF Simulator
generation pipeline (`sim_status`: `queued → running → ready`, feeding the
`/batch2/reader` and `/batch3/reader` UI), plus the streak/leaderboard cron
jobs. It is a **separate process from the API on purpose**: ingestion is a
long synchronous block, so running it inside the API froze every in-flight
student request until a book finished processing. RAG ingestion and sim
generation are independent queues on the same worker — a book is usable by
the AI tutor as soon as `status='done'`, even while its simulations are
still generating in the background.

You only need it if you're uploading books, testing the cron jobs, or working
on the PDF Simulator — the API serves everything else fine without it,
uploads just sit in `queued` until a worker is running.

**6. The frontend** (from the repo root, separate terminal):
```bash
npm run dev
```
→ serves on **http://localhost:5173**

Then open **http://localhost:5173** in a browser.

### Ollama

Make sure the daemon is running and has the embedding model:
```bash
ollama pull mxbai-embed-large
```
Chat/grading/vision can run against this same local daemon (`OLLAMA_CHAT_MODEL` in `api/.env`) or be routed to a cloud OpenAI-compatible provider by setting `CLOUD_AI_BASE_URL` / `CLOUD_AI_API_KEY` — see `api/.env.example` for details. Embeddings always stay local.

## Useful URLs (local dev)

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:4000 |
| Supabase Studio | http://127.0.0.1:54323 |
| Supabase REST/Auth | http://127.0.0.1:54321 |
| Mailpit (dev email inbox) | http://127.0.0.1:54324 |

## Local test credentials

> ⚠️ **Local development only.** These accounts live in your local Supabase database and must never be reused in production. Change the super admin password after first login on any real deployment.

| Role | Email | Password | Lands on |
|---|---|---|---|
| Super Admin | `admin@eduai.local` | `ChangeMe-Now-1` | `/super-admin/schools` |
| School Admin | `e2e-admin@eduai.local` | `Admin-Demo-2026` | `/school-admin/dashboard` |
| Teacher (Mr. Rao) | `mr.rao.5d2a15@sps.delhi.01.eduai.local` | `Teacher-Demo-2026` | `/teacher/dashboard` |
| Student (Dev Kumar) | `dev.kumar.c43f1a@sps.delhi.01.eduai.local` | `2uBUAVW3` | student batch home |

The demo school code is **`SPS-DELHI-01`**. These are the values `seed:super-admin` / `seed:school-admin` set on a **fresh** database; schools, admins, teachers, and students beyond that are created through the app itself (Super Admin creates schools; School Admin imports teachers/students).

> **Passwords above not working?** `seed:super-admin` refuses to touch an account that already exists, so if you're running against a local database that's been used before, someone may have changed the password since (there's a self-service "change password" page). Either use whatever password was last set, or run `npx supabase db reset` for a genuinely clean slate that restores these exact values.

**Class 1–4 PIN login:** young students don't type emails — they use the **CLASS 1–4 (PIN)** tab on the login page (school code → class → section → tap their name → 4-digit PIN). This only works while their teacher has a live class session running.

> **Login fails with "Something went wrong — please try again"?** That means the frontend can't reach the backend — check the API (step 3 above) is actually running.

## Testing the PDF Simulator

Newest feature (Aug 2026): a textbook PDF becomes interactive per-page
simulations + a page-grounded AI tutor, for classes 5-10. It reuses the
existing NCERT upload pipeline — there is no separate upload flow.

1. Migration `20250101000186_pdf_simulator.sql` must be applied (`npx supabase migration up` — see above) and the **worker** must be running (step 5) — sim generation happens there, not in the API.
2. Log in as Super Admin → Content Portal, upload (or find) a Class 5-10 Maths/Science NCERT PDF. Platform-wide uploads for that class/subject range auto-queue simulation generation once RAG ingestion (`status`) reaches `done`; a school's own upload needs an explicit **Enable** in the new Simulations column.
3. Watch `sim_status` progress `queued → running → ready` in that same column (independent of the RAG `status` column/progress bar).
4. Log in as a student in that class → the reader tab (`/batch2/reader` or `/batch3/reader`, depending on which batch layout the student's class uses) lists books with `sim_status='ready'`. Open one: PDF renders from a 15-minute signed URL, simulations appear on annotated pages, highlight text for an explanation, ask the chat tutor a question, take notes.
5. To confirm the entitlement gate: toggle `pdf_simulator` off for a school in the Super Admin entitlements editor — the reader nav tab should disappear and the `/student/sim/*` API routes should start returning 403.

`api/tests/simIsolation.test.ts` covers the cross-class/cross-school access boundary (a student should never reach a book outside their class, or another school's own upload) but needs the local stack up to run — see the `npm run test:security` note below.

## Other commands

**Frontend** (repo root):
```bash
npm run build     # typecheck + production build
npm run lint       # eslint
npm run preview    # preview a production build
```

**API** (`api/`):
```bash
npm run build       # tsc compile to dist/
npm run start       # run the compiled build (node dist/index.js)
npm run start:worker # run the compiled worker (node dist/worker.js)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run seed:super-admin   # seed a Super Admin account (no-op if one already exists)
npm run seed:school-admin  # seed a School Admin + demo school
npm run seed:test-roster   # seed the demo teacher/student roster (Mr. Rao, Dev Kumar, etc.)
npm run test         # vitest run — full suite (no DB needed for most files)
npm run test:security # vitest run tests/security.test.ts — needs the local Supabase stack up
npm run test:watch   # vitest, watch mode
```

A few one-off scripts exist but aren't wired to `npm run` — invoke directly with `npx tsx`:
```bash
npx tsx scripts/seedSampleRagContent.ts   # seed fake RAG chunks without uploading a real PDF
npx tsx scripts/uploadLabAssets.ts        # push Science Lab asset files to Supabase Storage
npx tsx scripts/testMail.ts               # send a test email through the configured SMTP settings
npx tsx scripts/testPdfExtract.ts <path>  # sanity-check MuPDF text extraction on a local PDF
```

> Some `isolation.test.ts` / `security.test.ts` / `simIsolation.test.ts` suites create and tear down real fixture rows against the local Postgres + GoTrue stack — they need `npx supabase start` (and, per above, `npx supabase migration up`) run first, not just `npm test` on its own.

## Stopping

- `Ctrl+C` each `npm run dev` / `npm run dev:worker` process
- `npx supabase stop` to stop the local Supabase containers

## Production deployment

A separate, fully containerized stack (Supabase + API + Ollama + Nginx) is defined in `docker-compose.yml` for deploying to a real school server — copy `.env.example` to `.env` at the repo root, fill in every value, then `docker compose up -d`. This is a different path from the local dev workflow above (which uses the Supabase CLI directly, not the bundled Supabase containers in `docker-compose.yml`).

The frontend static build (`./dist`, mounted into Nginx) is produced separately with `npm run build` — before building for a real deployment, set a root `.env` with `VITE_API_URL=https://yourschool.example/api` and `VITE_SUPABASE_PUBLIC_URL=https://yourschool.example/supabase` (Nginx's `/supabase/` location proxies this straight to Kong) so the Class 9-10 lab diagrams and other Supabase Storage assets resolve correctly.
