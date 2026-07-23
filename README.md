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

Four things need to be running. Open a separate terminal for each of the two `npm run dev` commands (Docker Desktop and Ollama run as background apps/services).

**1. Docker Desktop** — make sure it's running (Supabase runs in containers).

**2. Local Supabase** (from the repo root):
```bash
npx supabase start
```
This prints the local `API_URL`, `SERVICE_ROLE_KEY`, `STUDIO_URL`, etc. First run applies all migrations automatically.

**3. The API** (in `api/`):
```bash
cd api
npm run dev
```
→ listens on **http://localhost:4000**

**4. The frontend** (from the repo root, separate terminal):
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
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run seed:super-admin   # seed a Super Admin account
npm run seed:school-admin  # seed a School Admin account
```

## Stopping

- `Ctrl+C` both `npm run dev` processes
- `npx supabase stop` to stop the local Supabase containers

## Production deployment

A separate, fully containerized stack (Supabase + API + Ollama + Nginx) is defined in `docker-compose.yml` for deploying to a real school server — copy `.env.example` to `.env` at the repo root, fill in every value, then `docker compose up -d`. This is a different path from the local dev workflow above (which uses the Supabase CLI directly, not the bundled Supabase containers in `docker-compose.yml`).
