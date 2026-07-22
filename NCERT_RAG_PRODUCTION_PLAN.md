# NCERT RAG System — Production Plan
### Book management per class · Teacher exam/quiz generation · AI answer checking · Model strategy

> **Created:** July 10, 2026
> **Scope:** The complete pipeline from "I upload NCERT PDFs" to (a) the Batch 2/3 AI tutor answering with textbook text + figures, (b) teachers generating exams/quizzes from any chapter, (c) AI-checked subjective answers — at the lowest workable cost, production-grade.
> **Grounding:** This doc describes the system as it EXISTS in this repo (tables, services, routes already built) plus exactly what remains. It is not a greenfield proposal.

---

## Table of Contents

1. [The Content Model — how books map to classes, subjects, batches](#1-the-content-model)
2. [Ingestion Pipeline — PDF in, searchable knowledge out](#2-ingestion-pipeline)
3. [How Class Separation Is Guaranteed](#3-class-separation)
4. [The AI Tutor (Batch 2 & 3)](#4-the-ai-tutor)
5. [Teacher Features Powered by the Same Data](#5-teacher-features)
6. [Model Strategy — low cost, good accuracy](#6-model-strategy)
7. [Production Hardening](#7-production-hardening)
8. [Rollout Checklist](#8-rollout-checklist)

---

## 1. The Content Model

### 1.1 One book = one upload = one row set

You upload **one PDF per book per class per subject**. Each upload creates one `ncert_ingestion_jobs` row (table already exists, migration `20250101000020`) and everything extracted from that PDF is tagged with the same four keys:

```
class_num   →  5..10          (the grade the book belongs to)
subject     →  'Science' etc. (must be on the class_subjects whitelist)
book_title  →  'Science — Class 7 (NCERT)'
chapter     →  detected per page (number + title)
```

**Batches are never stored on content.** Batch is *derived* from class (5–8 → Batch 2, 9–10 → Batch 3) the same way `student_profiles.batch_id` is derived. Content is always scoped at the **class** level — finer than batch — which is exactly what makes "a Class 5 student never sees Class 7 material" possible even inside the same batch.

### 1.2 The books matrix (what you'll upload)

From the `class_subjects` whitelist already seeded:

| Class | Subjects with a book to ingest | Books |
|---|---|---|
| 5 | English, Mathematics, World Around Us | 3 |
| 6–8 | English, Mathematics, Science, Social Science | 4 × 3 = 12 |
| 9–10 | English, Mathematics, Science, Social Science | 4 × 2 = 8 |

≈ **23 books** (Social Science is often 3–4 separate NCERT books per class — History/Geography/Civics/Economics; each is its own upload with the same `subject='Social Science'`, different `book_title`). Realistic total: **30–40 PDFs**.

### 1.3 Where things live

| Data | Store | Already exists? |
|---|---|---|
| Original PDFs | Supabase Storage bucket `ncert/` → `class-7/science/<file>.pdf` (`storage_path` column on the job) | table column ✅, bucket to create |
| Text chunks + embeddings | `text_chunks` (class, subject, book, chapter, page, content, `vector(1024)`) | ✅ |
| Figures + captions + embeddings | `book_images` (same keys + `image_url`, `caption`, `vector(1024)`) | ✅ |
| Job status/progress | `ncert_ingestion_jobs` (`queued → chunking → embedding → done/error`, chunk counters) | ✅ + Super Admin portal UI ✅ |
| Questions generated from books | `question_bank` (`scope='global'`, class, subject, `chapter_num`, type, rubric, marks) | ✅ table, generation flow to build |

---

## 2. Ingestion Pipeline

### 2.1 Current state — be precise

> **Updated July 13, 2026:** the pipeline below is now REAL — `lib/pdfExtract.ts` (MuPDF text + chapter detection + manual chapter-map override + figure/caption extraction, verified against a generated test PDF), `runIngestionPipeline` (Storage-backed, idempotent delete-then-insert, checkpointed, post-ingest `analyze_rag_tables()`), and an in-process single-concurrency worker (`jobs/ingestionWorker.job.ts`) with crash-requeue + a retry endpoint. Migration `20250101000021` added the `ncert`/`chat-uploads` buckets and `chapter_map`. The mock is gone. What remains operationally: run the migration, upload real books, spot-check retrieval (the `rag-eval` golden-question script is still to build).

### 2.2 The pipeline (per job)

```
PDF upload (Super Admin portal)
   │  job: queued
   ▼
STAGE 1 · EXTRACT  (job: chunking)
   • Open PDF with MuPDF (the official `mupdf` npm WASM package — pure Node,
     no Python sidecar, handles NCERT PDFs' two-column layouts well)
   • Per page: extract text blocks in reading order
   • Chapter detection:
       a) match heading patterns ("CHAPTER 7", "7. Nutrition in Plants", TOC page map)
       b) fallback: a chapter map typed in the upload form (chapter → page range)
          — NCERT books are stable; 10 minutes of manual mapping per book
          beats heuristics silently mis-tagging chapters
   • Chunking: ~500 tokens per chunk, 60-token overlap, never across chapter
     boundaries; store class/subject/book/chapter_num/chapter_title/page_num
   ▼
STAGE 2 · FIGURES  (same stage, per page)
   • Extract embedded images ≥ 15 kB (skips decorative bullets/borders)
   • Caption = nearest text block below/beside matching /^(Fig|Figure|Activity|Table)\s/i,
     else the chapter title as a weak caption
   • Upload PNG to Storage → public URL → `book_images` row
   • Embed the CAPTION text (not pixels) with mxbai — a child asking
     "show me the triangle from chapter 11" matches "Fig 11.4 Triangle ABC"
   ▼
STAGE 3 · EMBED  (job: embedding, resumable)
   • For each chunk/caption without an embedding: mxbai-embed-large (local, free)
   • Batch 16 at a time; update chunks_embedded counter every batch
     (the portal's progress bar is already wired to these counters)
   ▼
job: done   (or error + error_message, retryable)
```

**Idempotency rule:** re-running a job first deletes that job's chunks/images (`delete where … book_title = job.book_title and class_num/subject match`) then re-inserts. Re-uploading a corrected PDF is therefore always safe.

**Throughput expectation:** a 200-page NCERT book ≈ 500–700 chunks + 100–200 figures. On CPU-only hardware, mxbai embeds ~5–15 chunks/sec → **one book ingests in roughly 2–5 minutes**. The whole library is an afternoon, one time, per server.

### 2.3 Worker shape (production)

- Runs **inside the existing API process** as a single-concurrency poll loop over `ncert_ingestion_jobs where status='queued'` (a school server doesn't need Redis/BullMQ; the jobs table *is* the queue and survives restarts because every stage checkpoint is persisted).
- Stage checkpoints mean a crash mid-book resumes at the last counter, not from zero.
- Concurrency 1 protects lab-hour CPU: ingestion is an admin task done before rollout, not during class.

---

## 3. Class Separation

This is enforced at **three layers**, none of which is "the prompt":

1. **Row tags** — every chunk/image row carries `class_num + subject` from its source book. Content from the Class 7 Science PDF physically cannot be tagged Class 5.
2. **SQL filter in retrieval** — `search_text_chunks` / `search_book_images` (migration `20250101000011`) filter `where class_num = match_class and subject = match_subject` *before* the vector ranking runs. A Class 5 query never even scores Class 7 chunks — overlapping topics ("fractions" exists in both) are structurally incapable of cross-contaminating.
3. **Server-side session binding** — fixed July 10: `chat_sessions.class_num` now always comes from `student_profiles`, never the client. A Class 5 login cannot open a Class 7 session even with a hand-crafted API call. (Same trust boundary as games and exams.)

The subject picker is also whitelist-driven (`class_subjects`), so a Class 5 student can't even *select* a subject their class doesn't have.

---

## 4. The AI Tutor

Already built end-to-end in `chat.service.ts` + `ChatCenter.tsx`; it just needs content. Per message:

```
question → embed locally → parallel:
  ├─ top-5 text chunks   (this class + subject only)
  └─ top-3 figures       (this class + subject only)
→ LLM answers WITH the chunks as context, LaTeX for maths
→ response = answer + sources[{book, chapter, page, excerpt}]
           + returnedImages[{url, caption, chapter, page}]
```

Your geometry example works exactly like this: the question embeds close to the "Fig 11.4" caption → the figure URL rides back on the message → `ChatCenter` renders the actual textbook figure under the explanation, labelled with chapter and page. If retrieval finds nothing above the similarity floor, the system prompt makes the model **say so** instead of hallucinating a different class's method.

Existing guardrails: 50 messages/student/day rate limit, Batch 2/3 only (Batch 1 has no chat surface), teacher-readable chat history (RLS), graceful "tutor offline" fallback when the daemon is down.

---

## 5. Teacher Features

The same ingested data powers three teacher workflows. One exists, two to build:

### 5.1 AI-checked subjective answers — ✅ built (`grading.service.ts`)

On exam submit: objective questions (MCQ/TF/fill-blank) grade **deterministically** — no AI, no cost. Subjective answers go to the LLM as a strict CBSE-examiner prompt with the question's **rubric**, returning JSON: `{score, covered_points, missing_points, feedback}` clamped to the question's marks. Results land on `exam_answers.ai_*` columns; the teacher's **review queue** (`/teacher/exams/:id/review`, already shipped) shows AI score + reasoning and lets the teacher **override** — the AI proposes, the teacher disposes. AI failure ≠ lost marks: the answer just stays "pending manual review".

**Book-grounding upgrade (small, high value):** when grading, also retrieve the top-3 chunks for the question's chapter and inject them as reference material — the examiner then checks the student against *the book's* definition, not the model's general knowledge.

### 5.2 Generate questions from a chapter — 🔨 to build (the biggest new piece)

```
POST /api/teacher/question-gen        { subject, chapterNum, counts: {mcq: 5, short: 3, long: 1}, difficulty }
POST /api/super-admin/question-gen    (same, but writes scope='global' after review)
```

Flow: pull that chapter's chunks (no embedding search needed — direct
`where class_num/subject/chapter_num` fetch, sampled across pages) →
LLM in JSON mode drafts questions **with answers, distractors, marks and a
rubric for subjective ones**, each tagged with the source page → land in a
**draft state the teacher must review** (edit/delete/accept) → accepted
questions insert into `question_bank` with `class_num + subject + chapter_num`
(columns already exist and the whole exam machinery already consumes them).

Why review-first is non-negotiable: generated questions go in front of
children and onto report cards. The teacher approval step is the quality
gate — same philosophy as AI grading with teacher override.

From there, **zero new exam machinery is needed**: the existing Create Exam
builder's add-from-bank flow filters by class/subject/chapter, per-section
windows, admit cards, proctoring, merit lists — all shipped and E2E-verified.

### 5.3 One-click chapter quiz — 🔨 thin wrapper over 5.2

"Quick Quiz" button on a chapter: generate 5 MCQs → auto-create a 10-minute
exam → publish to the teacher's selected section. Reuses `createExam` +
`addFromBank` + `publishExam` verbatim. This is also the engine that will
later feed Batch 1's per-chapter quizzes.

---

## 6. Model Strategy

### 6.1 The principle: route by task, pay only where accuracy earns it

Different jobs have wildly different accuracy/latency needs. One expensive
model for everything is how cost explodes; one cheap model for everything is
how grading goes wrong. The infrastructure for routing already exists — the
Ollama daemon treats `model` as just a string, local names run on-box,
`-cloud` names proxy to Ollama Cloud on a **flat subscription** (no per-token
metering at the application layer).

| Task | Volume | Needs | Model (env var) |
|---|---|---|---|
| **Embeddings** (every chat msg, every chunk) | very high | consistency, zero cost | `mxbai-embed-large` **local, free** — never change casually: 16k chunks are embedded in this space (`OLLAMA_EMBED_MODEL`) |
| **Tutor chat** | high (50/student/day cap) | speed, decent reasoning, grounded by RAG anyway | small instruct model: `qwen2.5:7b-instruct` local if the server has any GPU; else `gpt-oss:20b-cloud` (`OLLAMA_CHAT_MODEL` — exists) |
| **Subjective grading** | low, bursty (exam days), **async** | accuracy ≫ speed; JSON discipline | bigger model: `gpt-oss:20b-cloud` or `qwen2.5:14b/32b` local-GPU (`OLLAMA_GRADING_MODEL` — add) |
| **Question generation** | very low (teacher-initiated) | highest quality, human-reviewed anyway | same as grading tier (`OLLAMA_QGEN_MODEL` — add) |

Code change required: ~10 lines — `chatCompletion(messages, { model?: string })`
override + two new env vars, defaulting to the chat model. Everything else is
configuration.

### 6.2 Why this is the low-cost sweet spot

- **The expensive high-volume operations are free.** Retrieval (embeddings) is
  local; RAG then does the heavy lifting so the *chat* model only needs to
  paraphrase provided textbook context — the pattern that lets a 7B model
  behave far above its size. Grounded context substitutes for model size.
- **The tasks that genuinely need a stronger model are rare and asynchronous**
  (grading runs at submit time, generation runs when a teacher clicks a
  button) — tolerant of a slower/queued cloud call, and capped by human
  volume, not student volume.
- **Flat-fee cloud proxy** (current architecture) means a hard monthly cost
  ceiling per school server — no surprise bills from a chatty class. If a
  school buys one mid-range GPU (even an RTX 4060-class card), the whole
  stack runs **fully local at zero marginal cost** and the cloud becomes a
  fallback (`OLLAMA_CHAT_MODEL=qwen2.5:7b-instruct`, grading on
  `qwen2.5:14b`). The same env vars cover both worlds; no code fork.
- Accuracy protection where it matters is **procedural, not just model
  choice**: deterministic grading for objective questions, rubric + JSON
  schema + clamping for subjective, teacher override on everything AI writes.

### 6.3 What NOT to do

- Don't per-token-meter the tutor with a large hosted model — 200 kids × lab
  period × cloud GPT-class pricing is exactly the bill this architecture avoids.
- Don't grade with the 7B tutor model to save a config line — grading errors
  are the single fastest way to lose teacher trust; that tier is where the
  marginal accuracy is worth paying/queueing for.
- Don't re-embed the library with a new embedding model mid-year — query and
  corpus vectors must come from the same model; changing it means re-ingesting
  everything (it's cheap, ~an afternoon, but it's all-or-nothing).

---

## 7. Production Hardening

| Concern | Measure |
|---|---|
| **Vector index quality after bulk load** | ivfflat indexes were created on empty tables; after ingesting the library run `REINDEX` + `ANALYZE` on `text_chunks`/`book_images` (one migration or admin script). ~16k rows is comfortably inside ivfflat's sweet spot. |
| **Retrieval regression testing** | A `rag-eval` script with ~10 golden questions per class+subject ("expected chapter N in top-5"). Run after every ingestion — catches a bad PDF/chapter map immediately, before a child does. |
| **Figure serving** | `book_images.image_url` points at Supabase Storage behind the existing nginx (`docker-compose.yml`) — same-origin, cache headers on, no CSP surprises in the chat UI. |
| **Ingestion safety** | Jobs single-concurrency, stage-checkpointed, idempotent re-runs (delete-then-insert per book). Errors persist to `error_message` and surface in the portal dashboard that already exists. |
| **Cost ceiling** | Local embeddings + flat-fee cloud chat = fixed monthly cost per school. Daily per-student message cap already enforced (`rateLimit` 50/day). Add a per-school daily grading budget alarm (count `ai_scored_at` per day) as a log metric. |
| **Trust boundary** | Students: read-only on RAG tables via RLS; all writes go through the service-role API. Session class binding server-side (fixed). Generated questions and AI scores are always human-reviewable before/after they matter. |
| **Offline degradation** | Daemon down → tutor says "try again / ask your teacher" (shipped), grading falls back to manual review queue (shipped), games/exams unaffected. AI is an enhancement layer, never a single point of failure. |
| **Backups** | `text_chunks`/`book_images` are re-derivable from PDFs — back up the Storage bucket + `ncert_ingestion_jobs`; vectors can always be rebuilt. |

---

## 8. Rollout Checklist

**Build (order matters):**
1. ✅ Real extraction in `runIngestionPipeline` — MuPDF text + chapter map + chunking (`lib/pdfExtract.ts`; mock deleted) *(July 13)*
2. ✅ Figure extraction + caption pairing + Storage upload → `book_images` *(July 13)*
3. ✅ Model routing — `lib/ai.ts` tiers (`AI_CHAT/GRADING/QGEN/VISION_MODEL`), cloud OpenAI-compatible provider with Ollama fallback *(July 13; supersedes the OLLAMA_* naming below)*
4. ☐ Question generation endpoints + teacher review UI (draft → accept → `question_bank`)
5. ☐ "Quick Quiz from chapter" wrapper
6. 🟡 Post-ingest `ANALYZE` done (`analyze_rag_tables()` called by the pipeline); `rag-eval` golden-question script still to build
7. ☐ Book-grounded grading (inject chapter chunks into the examiner prompt)
8. ✅ *(new)* Vision doubt-solving in chat — photo upload → `chat-uploads` bucket → vision-tier transcribe-for-retrieval → multimodal answer *(July 13)*

**Operate (per school server):**
1. ☐ Create `ncert` Storage bucket; pull `mxbai-embed-large` (+ local chat model if GPU)
2. ☐ Upload PDFs class-by-class via Super Admin → Content Portal (start with ONE book — Class 7 Science — run the eval, then batch the rest)
3. ☐ Verify each class's tutor cites the right book/chapters (eval script + a manual spot-check per class)
4. ☐ Teachers generate + review question sets per chapter as they reach them in the syllabus — the bank grows with the school year, no big-bang authoring needed

**The single biggest dependency:** item 1 of Build. Everything else in this
document — tutor with figures, exam generation, chapter quizzes, grounded
grading — is already plumbed to light up the moment real chunks exist.
