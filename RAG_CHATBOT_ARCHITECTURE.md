
# EduAI — RAG Chatbot Architecture & Backend Plan

> **Last updated:** June 17, 2026
> **Scope:** Multimodal RAG chatbot over NCERT PDFs — text Q&A, student image upload, textbook image retrieval
> **Stack:** Supabase (pgvector + Storage) · Claude API (claude-sonnet-4-6) · Python ingestion · Node/Edge Function query layer

---

## Table of Contents

1. [What This System Does](#1-what-this-system-does)
2. [NCERT Books Hierarchy](#2-ncert-books-hierarchy)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Ingestion Pipeline](#4-ingestion-pipeline)
5. [Query Pipeline](#5-query-pipeline)
6. [Database Schema](#6-database-schema)
7. [API Endpoint Design](#7-api-endpoint-design)
8. [File Storage Structure](#8-file-storage-structure)
9. [Tech Stack Decisions](#9-tech-stack-decisions)
10. [Implementation Phases](#10-implementation-phases)
11. [Cost Estimates](#11-cost-estimates)
12. [What Makes This Hard](#12-what-makes-this-hard)

---

## 1. What This System Does

The RAG chatbot has four distinct capabilities, all served from one `/api/chat/message` endpoint:

| Capability | Trigger | What Happens |
|-----------|---------|-------------|
| **Text Q&A** | Student types a question | Embed query → retrieve NCERT text chunks → Claude answers with citations |
| **Vision Input** | Student uploads a photo of a question/diagram | Claude Vision extracts the question → same RAG flow as above |
| **Textbook Image Return** | Student asks "show me the diagram of mitosis" | pgvector image search → return actual NCERT diagram URL from Storage |
| **Scoped Context** | Always active | Every query is filtered by class, subject, and stream — Class 7 never gets Class 12 content |

### What the UI already has (needs to be wired to real backend)

- `POST /batch2/chat` — AI doubt solver (Batch 2, Classes 5–8)
- `POST /batch3/chat` — AI chat with LaTeX support (Batch 3, Classes 9–10)
- `POST /batch4/chat` — AI problem solver (Batch 4, Classes 11–12)
- `POST /batch1/show-and-tell` — Vision AI for uploaded object photos (Batch 1)
- Image upload button (`📎`) already exists in all chat UIs
- Suggested question chips already exist in all chat UIs

---

## 2. NCERT Books Hierarchy

Derived from `Books Heirarchy.xlsx`. Approximately **120+ PDFs** total.

### Classes 1–5 (Batch 1 & lower Batch 2)

| Class | Subjects |
|-------|---------|
| Class 1 | English, Mathematics, Hindi |
| Class 2 | English, Mathematics, Hindi |
| Class 3 | English, Mathematics, Hindi, World Around Us, Arts, Physical Education |
| Class 4 | English, Mathematics, Hindi, World Around Us, Arts, Physical Education |
| Class 5 | English, Mathematics, Hindi, World Around Us, Arts, Physical Education |

### Classes 6–10 (Batch 2 & Batch 3)

| Class | Subjects |
|-------|---------|
| Class 6 | English, Mathematics, Science, Social Science, Hindi, Sanskrit, Arts, PE |
| Class 7 | English, Mathematics, Science, Social Science, Hindi, Sanskrit, Arts, PE |
| Class 8 | English, Mathematics, Science, Social Science, Hindi, Sanskrit, Arts, PE |
| Class 9 | English, Mathematics, Science, Social Science, Hindi, Sanskrit, Arts, PE |
| Class 10 | English, Mathematics, Science, Social Science, Hindi, Sanskrit, PE |

### Class 11 — Three Streams (Batch 4)

| Stream | Subjects |
|--------|---------|
| **Science** | Physics Part 1, Physics Part 2, Chemistry Part 1, Chemistry Part 2, Biology, Mathematics, Physical Education, Informatics Practices, Psychology, Computer Science |
| **Commerce** | Accountancy Part 1, Accountancy Part 2, Business Studies Part 1, Economics, English, PE, Home Science 1 & 2 |
| **Arts** | History, Political Science, Geography, Sociology, Psychology, Fine Arts, Physical Education, Economics |

### Class 12 — Three Streams (Batch 4)

| Stream | Subjects |
|--------|---------|
| **Science** | Physics Part 1 & 2, Chemistry Part 1 & 2, Biology, Maths Part 1 & 2, English, Computer Science, PE, Psychology |
| **Commerce** | Accountancy Part 1 & 2, Business Studies Part 1 & 2, Economics, English, PE, Home Science, Fine Arts |
| **Arts** | History Part 1 & 2, Political Science Part 1 & 2, Geography Part 1 & 2, Sociology, Psychology, Fine Arts, Economics |

### Folder Naming Convention (for ingestion)

```
books/
  class_01/english/ncert_english_1.pdf
  class_01/mathematics/ncert_maths_1.pdf
  class_01/hindi/ncert_hindi_1.pdf
  class_06/science/ncert_science_6.pdf
  class_06/social_science/ncert_social_6.pdf
  class_11/science/physics_1/ncert_physics1_11.pdf
  class_11/science/chemistry_1/ncert_chem1_11.pdf
  class_11/commerce/accountancy_1/ncert_acc1_11.pdf
  class_11/arts/history/ncert_history_11.pdf
  class_12/science/biology/ncert_biology_12.pdf
  ...
```

---

## 3. System Architecture Overview

```
╔══════════════════════════════════════════════════════════════════╗
║                  INGESTION PIPELINE (One-time job)               ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   120 NCERT PDFs (local or S3)                                   ║
║          │                                                       ║
║          ▼                                                       ║
║   [PyMuPDF Parser]                                               ║
║     ├── Extract text per page                                    ║
║     │     └── Chunk by section (~500 tokens, 50-token overlap)   ║
║     └── Extract images (PNG) per page                            ║
║               │                                                  ║
║               ▼                                                  ║
║   [Supabase Storage]  ← upload raw images                        ║
║     bucket: ncert-images/{class}/{subject}/{chapter}/pg{n}.png   ║
║               │                                                  ║-
║               ▼                                                  ║
║   [Claude Vision API]  ← caption each extracted image            ║
║     "NCERT Class 10 Science Ch 6 — Diagram showing the stages    ║
║      of mitosis: prophase, metaphase, anaphase, telophase"       ║
║               │                                                  ║
║               ▼                                                  ║
║   [OpenAI text-embedding-3-small]                                ║
║     ├── Embed all text chunks       → 1536-dim vectors           ║
║     └── Embed all image captions    → 1536-dim vectors           ║
║               │                                                  ║
║               ▼                                                  ║
║   [Supabase PostgreSQL + pgvector]                               ║
║     ├── table: text_chunks    (text + embedding + metadata)      ║
║     └── table: book_images    (url + caption + embedding)        ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                  QUERY PIPELINE (Every chat message)             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   Student Chat UI                                                ║
║     ├── Types a question (text)                                  ║
║     └── Uploads a photo (optional image)                         ║
║          │                                                       ║
║          ▼                                                       ║
║   POST /api/chat/message                                         ║
║     { text, image_base64?, class_num, subject, stream? }        ║
║          │                                                       ║
║          ├── [IF image uploaded]                                 ║
║          │     └── Claude Vision → extract question from photo   ║
║          │                         → merge with typed text       ║
║          │                                                       ║
║          ▼                                                       ║
║   [Embed query text]  →  1536-dim query vector                   ║
║          │                                                       ║
║          ▼  (parallel)                                           ║
║   ┌───────────────────┬────────────────────────┐                 ║
║   │ text_chunks search│  book_images search     │                 ║
║   │ top 5 results     │  top 3 results          │                 ║
║   │ filtered by:      │  filtered by:           │                 ║
║   │  · class_num      │   · class_num           │                 ║
║   │  · subject        │   · subject             │                 ║
║   │  · stream         │   · stream              │                 ║
║   └────────┬──────────┴──────────┬─────────────┘                 ║
║            │                    │                                ║
║            ▼                    ▼                                ║
║   [Claude claude-sonnet-4-6 API]                                 ║
║     System: "You are an NCERT tutor for Class {n} {subject}.    ║
║              Answer using ONLY the provided context.             ║
║              Use LaTeX for equations. Cite chapter and page."   ║
║     Context: retrieved text chunks + image captions              ║
║     User:    original question + uploaded image (if any)         ║
║          │                                                       ║
║          ▼                                                       ║
║   Response JSON:                                                 ║
║     {                                                            ║
║       answer: "markdown + LaTeX",                                ║
║       sources: [{ chapter, page, book, excerpt }],               ║
║       textbook_images: [{ url, caption, chapter, page }]         ║
║     }                                                            ║
║          │                                                       ║
║          ▼                                                       ║
║   Chat UI renders:                                               ║
║     ├── Text answer (with LaTeX via KaTeX)                       ║
║     ├── Source citations ("NCERT Class 9 Science, Ch 6, Pg 78") ║
║     └── Textbook images (inline in chat bubble)                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 4. Ingestion Pipeline

> Run once when you add new books. Re-run per book when PDFs are updated.
> Language: **Python 3.11+**

### Dependencies

```
pymupdf          # PDF text + image extraction
openai           # text-embedding-3-small
anthropic        # Claude Vision for image captioning
supabase-py      # DB upsert + Storage upload
python-dotenv    # env vars
tiktoken         # token counting for chunking
tqdm             # progress bars
```

### Step-by-Step Process

#### Step 1 — Parse PDF, Extract Text + Images

```python
import fitz  # PyMuPDF

doc = fitz.open("ncert_science_10.pdf")

for page_num, page in enumerate(doc, start=1):
    # --- TEXT ---
    text = page.get_text("text")
    # chunk into ~500 tokens with 50-token overlap

    # --- IMAGES ---
    image_list = page.get_images(full=True)
    for img_index, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]       # png / jpeg
        # save to disk, then upload to Supabase Storage
```

#### Step 2 — Chunk Text Intelligently

```
Strategy: chapter-aware chunking
- Split on chapter headings (regex: "Chapter \d+" or numbered sections)
- Each chunk: ~500 tokens with 50-token overlap
- Metadata per chunk: {class_num, stream, subject, book_title, chapter_num, chapter_title, page_num}
- Min chunk size: 100 tokens (skip headers/page numbers)
```

#### Step 3 — Caption Images with Claude Vision

```python
import anthropic
import base64

client = anthropic.Anthropic()

def caption_image(image_bytes, class_num, subject, chapter_title):
    b64 = base64.b64encode(image_bytes).decode()
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": b64
                    }
                },
                {
                    "type": "text",
                    "text": f"This image is from NCERT Class {class_num} {subject}, chapter: {chapter_title}. "
                            f"Write a precise 1-2 sentence caption describing what this diagram/figure shows. "
                            f"Include all labels visible in the image. "
                            f"Be specific enough that a student could find this image by searching for it."
                }
            ]
        }]
    )
    return response.content[0].text
```

#### Step 4 — Embed Text Chunks + Image Captions

```python
from openai import OpenAI

oai = OpenAI()

def embed(text: str) -> list[float]:
    response = oai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding
```

#### Step 5 — Upload to Supabase

```python
from supabase import create_client

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Upload image to Storage
def upload_image(image_bytes, path):
    sb.storage.from_("ncert-images").upload(path, image_bytes)
    return sb.storage.from_("ncert-images").get_public_url(path)

# Upsert text chunk
sb.table("text_chunks").upsert({
    "class_num": 10,
    "subject": "Science",
    "book_title": "NCERT Science Class 10",
    "chapter_num": 6,
    "chapter_title": "Life Processes",
    "page_num": 78,
    "content": chunk_text,
    "embedding": embedding_vector,   # list of 1536 floats
}).execute()

# Upsert book image
sb.table("book_images").upsert({
    "class_num": 10,
    "subject": "Science",
    "chapter_num": 6,
    "chapter_title": "Life Processes",
    "page_num": 78,
    "image_url": public_url,
    "caption": caption_text,
    "embedding": caption_embedding,
}).execute()
```

### Ingestion Script Execution Order

```bash
# 1. Ingest one book (test run)
python ingest.py --class 10 --subject science --pdf books/class_10/science/ncert_science_10.pdf

# 2. Ingest all books for a class
python ingest.py --class 10 --all

# 3. Full ingestion (takes ~4-6 hours for all 120 books)
python ingest.py --all

# 4. Re-ingest a single updated book
python ingest.py --class 12 --subject physics_1 --pdf books/class_12/... --overwrite
```

---

## 5. Query Pipeline

> Runs on every student chat message. Target latency: **< 3 seconds**.
> Runs as a **Supabase Edge Function** (Deno) or **Node.js API route**.

### Full Query Flow

```typescript
// 1. If image uploaded → extract question via Claude Vision
async function extractQuestionFromImage(imageBase64: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
        { type: "text", text: "This is a photo taken by a student of a question or diagram. Extract the exact question text or describe what is being asked. Return ONLY the question, nothing else." }
      ]
    }]
  });
  return response.content[0].text;
}

// 2. Embed the query
async function embedQuery(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return response.data[0].embedding;
}

// 3. Dual retrieval (run in parallel)
async function retrieveContext(queryVector: number[], classNum: number, subject: string, stream?: string) {
  const [textChunks, bookImages] = await Promise.all([
    // Text similarity search
    supabase.rpc("search_text_chunks", {
      query_embedding: queryVector,
      match_class: classNum,
      match_subject: subject,
      match_stream: stream ?? null,
      match_count: 5
    }),
    // Image similarity search
    supabase.rpc("search_book_images", {
      query_embedding: queryVector,
      match_class: classNum,
      match_subject: subject,
      match_stream: stream ?? null,
      match_count: 3
    })
  ]);
  return { textChunks: textChunks.data, bookImages: bookImages.data };
}

// 4. Generate answer with Claude
async function generateAnswer(
  question: string,
  uploadedImageBase64: string | null,
  textChunks: any[],
  bookImages: any[],
  classNum: number,
  subject: string
) {
  const contextText = textChunks
    .map(c => `[${c.book_title}, Ch${c.chapter_num} "${c.chapter_title}", Pg${c.page_num}]\n${c.content}`)
    .join("\n\n---\n\n");

  const imageContext = bookImages
    .map(i => `[Image: ${i.caption} — ${i.chapter_title}, Pg${i.page_num}]`)
    .join("\n");

  const userContent: any[] = [];

  // If student uploaded an image, include it
  if (uploadedImageBase64) {
    userContent.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: uploadedImageBase64 }
    });
  }

  userContent.push({
    type: "text",
    text: question
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: `You are a helpful NCERT tutor for Class ${classNum} ${subject} students in India.
Answer questions using ONLY the provided NCERT context below.
Use LaTeX for all mathematical equations (wrap in $...$ for inline, $$...$$ for block).
At the end of your answer, cite the source as: *Source: [book title], Chapter [n], Page [n]*.
If the context does not contain enough information, say so honestly — do not make up answers.
Keep your tone encouraging and age-appropriate for a Class ${classNum} student.

NCERT CONTEXT:
${contextText}

RELEVANT DIAGRAMS IN TEXTBOOK:
${imageContext}`,
    messages: [{ role: "user", content: userContent }]
  });

  return response.content[0].text;
}
```

### Supabase RPC Functions (SQL)

```sql
-- Text chunk similarity search
CREATE OR REPLACE FUNCTION search_text_chunks(
  query_embedding vector(1536),
  match_class     int,
  match_subject   text,
  match_stream    text DEFAULT NULL,
  match_count     int  DEFAULT 5
)
RETURNS TABLE (
  id            uuid,
  content       text,
  book_title    text,
  chapter_num   int,
  chapter_title text,
  page_num      int,
  similarity    float
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, content, book_title, chapter_num, chapter_title, page_num,
    1 - (embedding <=> query_embedding) AS similarity
  FROM text_chunks
  WHERE class_num = match_class
    AND subject   = match_subject
    AND (match_stream IS NULL OR stream = match_stream)
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Book image similarity search
CREATE OR REPLACE FUNCTION search_book_images(
  query_embedding vector(1536),
  match_class     int,
  match_subject   text,
  match_stream    text DEFAULT NULL,
  match_count     int  DEFAULT 3
)
RETURNS TABLE (
  id            uuid,
  image_url     text,
  caption       text,
  chapter_title text,
  page_num      int,
  similarity    float
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, image_url, caption, chapter_title, page_num,
    1 - (embedding <=> query_embedding) AS similarity
  FROM book_images
  WHERE class_num = match_class
    AND subject   = match_subject
    AND (match_stream IS NULL OR stream = match_stream)
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 6. Database Schema

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────
--  TEXT CHUNKS
-- ─────────────────────────────────────────────
CREATE TABLE text_chunks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_num     INT         NOT NULL CHECK (class_num BETWEEN 1 AND 12),
  stream        TEXT        CHECK (stream IN ('science', 'commerce', 'arts')),
  subject       TEXT        NOT NULL,
  book_title    TEXT        NOT NULL,
  chapter_num   INT,
  chapter_title TEXT,
  page_num      INT,
  content       TEXT        NOT NULL,
  token_count   INT,
  embedding     vector(1536),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON text_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON text_chunks (class_num, subject);
CREATE INDEX ON text_chunks (class_num, stream, subject);

-- ─────────────────────────────────────────────
--  BOOK IMAGES
-- ─────────────────────────────────────────────
CREATE TABLE book_images (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_num     INT         NOT NULL CHECK (class_num BETWEEN 1 AND 12),
  stream        TEXT        CHECK (stream IN ('science', 'commerce', 'arts')),
  subject       TEXT        NOT NULL,
  book_title    TEXT,
  chapter_num   INT,
  chapter_title TEXT,
  page_num      INT,
  image_url     TEXT        NOT NULL,
  caption       TEXT,
  embedding     vector(1536),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON book_images USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON book_images (class_num, subject);

-- ─────────────────────────────────────────────
--  CHAT SESSIONS
-- ─────────────────────────────────────────────
CREATE TABLE chat_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_num    INT,
  subject      TEXT,
  stream       TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────
--  CHAT MESSAGES
-- ─────────────────────────────────────────────
CREATE TABLE chat_messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role             TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT,
  image_url        TEXT,                    -- student-uploaded photo URL (if any)
  sources          JSONB,                   -- [{ chunk_id, book_title, chapter, page, excerpt }]
  returned_images  JSONB,                   -- [{ image_id, url, caption, chapter, page }]
  tokens_used      INT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON chat_messages (session_id, created_at);

-- ─────────────────────────────────────────────
--  ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE chat_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages  ENABLE ROW LEVEL SECURITY;

-- Students can only see their own sessions
CREATE POLICY "students_own_sessions"
  ON chat_sessions FOR ALL
  USING (auth.uid() = student_id);

-- Students can only see messages from their own sessions
CREATE POLICY "students_own_messages"
  ON chat_messages FOR ALL
  USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE student_id = auth.uid()
    )
  );

-- text_chunks and book_images are read-only for all authenticated users
ALTER TABLE text_chunks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_images  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_chunks"
  ON text_chunks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_images"
  ON book_images FOR SELECT
  USING (auth.role() = 'authenticated');
```

---

## 7. API Endpoint Design

### POST `/api/chat/message`

**Request:**
```typescript
{
  session_id:    string,         // UUID of existing session (or null to create new)
  text:          string,         // student's typed question
  image_base64?: string,         // base64-encoded student-uploaded photo (optional)
  class_num:     number,         // 1–12, for context scoping
  subject:       string,         // "Mathematics", "Science", "Physics 1", etc.
  stream?:       "science" | "commerce" | "arts"  // Class 11–12 only
}
```

**Response:**
```typescript
{
  session_id:       string,
  message_id:       string,
  answer:           string,       // markdown text with LaTeX ($$...$$)
  sources: [
    {
      book_title:     string,     // "NCERT Science Class 10"
      chapter_num:    number,
      chapter_title:  string,     // "Life Processes"
      page_num:       number,
      excerpt:        string      // brief relevant passage
    }
  ],
  textbook_images: [
    {
      image_url:      string,     // Supabase Storage public URL
      caption:        string,     // "Diagram showing stages of mitosis..."
      chapter_title:  string,
      page_num:       number
    }
  ]
}
```

### POST `/api/chat/session`

Creates a new chat session.

```typescript
// Request
{ class_num: number, subject: string, stream?: string }

// Response
{ session_id: string, created_at: string }
```

### GET `/api/chat/history/:session_id`

Returns all messages in a session (for loading previous chat).

```typescript
// Response
{
  session: { id, class_num, subject, created_at },
  messages: [
    {
      id, role, content, image_url,
      sources, returned_images, created_at
    }
  ]
}
```

### POST `/api/show-and-tell` (Batch 1 only)

```typescript
// Request
{ image_base64: string, class_num: 1 | 2 | 3 | 4 }

// Response
{
  subject_identified: string,   // "This appears to be a butterfly"
  fun_facts: string[],          // 3–5 age-appropriate facts
  ncert_connection: string,     // "You'll learn about this in Class 3 EVS!"
  related_image_url?: string    // relevant NCERT image if found
}
```

---

## 8. File Storage Structure

### Supabase Storage Buckets

```
bucket: ncert-images       (public read, service-role write)
  └── class_01/
      ├── english/
      │   ├── chapter_01/
      │   │   ├── pg_005_img_0.png
      │   │   └── pg_012_img_1.png
      │   └── chapter_02/
      └── mathematics/
  └── class_06/
      ├── science/
      │   ├── chapter_01/
      │   └── chapter_06/
      │       └── pg_078_img_0.png     ← "mitosis diagram"
      └── social_science/
  └── class_11/
      ├── science/
      │   ├── physics_1/
      │   └── chemistry_1/
      └── commerce/
          └── accountancy_1/
  └── class_12/
      └── ...

bucket: student-uploads    (private, per-user access via RLS)
  └── {user_id}/
      └── {timestamp}_chat_upload.jpg
```

---

## 9. Tech Stack Decisions

| Component | Choice | Reason |
|-----------|--------|--------|
| **PDF Parser** | PyMuPDF (fitz) | Best image extraction quality, handles NCERT formatting well, fast |
| **Embeddings** | OpenAI `text-embedding-3-small` | Cheapest ($0.02/1M tokens), 1536 dims, high accuracy |
| **Vector DB** | Supabase pgvector | Already using Supabase — no extra service, full SQL control, IVFFlat index |
| **LLM** | Claude `claude-sonnet-4-6` | Best reasoning, vision support, long context (200k), good for math/science |
| **Image Captioning** | Claude Vision (`claude-sonnet-4-6`) | Same API — no second provider needed |
| **Image Storage** | Supabase Storage | Already using Supabase, RLS on student uploads, CDN delivery |
| **API Layer** | Supabase Edge Functions (Deno) or Node.js | Edge Functions for simple cases; Node.js if complex business logic needed |
| **Rate Limiting** | Upstash Redis (per-user token limit) | Prevent AI cost abuse, per-student daily quota |
| **LaTeX Rendering** | KaTeX (frontend) | Already plan for LaTeX in chat UI — wire KaTeX to parse `$...$` in responses |

### Why NOT these options

| Rejected | Reason |
|----------|--------|
| Pinecone / Qdrant | Extra vendor, extra cost — pgvector is sufficient for 120 books |
| GPT-4o | OpenAI for vision + text adds another provider; Claude does both |
| LangChain | Adds abstraction overhead — direct API calls are simpler and more predictable |
| Unstructured.io | Overkill for NCERT PDFs — PyMuPDF handles them cleanly |
| Weaviate | Yet another service — pgvector is sufficient at this scale |

---

## 10. Implementation Phases

### Phase 1 — Foundation (Week 1–2)

- [ ] Enable `pgvector` extension in Supabase
- [ ] Run SQL migrations: `text_chunks`, `book_images`, `chat_sessions`, `chat_messages`
- [ ] Create RLS policies
- [ ] Set up Supabase Storage buckets (`ncert-images`, `student-uploads`)
- [ ] Write and test ingestion script on 2–3 sample books (Class 10 Science, Class 9 Math)
- [ ] Verify embeddings are being stored correctly

### Phase 2 — Ingestion (Week 2–3)

- [ ] Full ingestion of all 120 NCERT PDFs (batch by class)
- [ ] Validate image extraction quality — check for low-res or blank images
- [ ] Validate caption quality — spot check 20 random captions
- [ ] Build ingestion status dashboard (which books are done)
- [ ] Handle edge cases: PDFs with no images, scanned PDFs (needs OCR), Hindi/Sanskrit PDFs

### Phase 3 — Query API (Week 3–4)

- [ ] Implement `search_text_chunks` SQL function
- [ ] Implement `search_book_images` SQL function
- [ ] Build `/api/chat/message` endpoint
- [ ] Add Claude Vision step for student-uploaded images
- [ ] Add `/api/chat/session` and `/api/chat/history` endpoints
- [ ] Add `/api/show-and-tell` endpoint (Batch 1)
- [ ] Test with real student questions across all batches

### Phase 4 — Frontend Wiring (Week 4–5)

- [ ] Replace mock chat responses with real API calls in all batch chat pages
- [ ] Add KaTeX for LaTeX rendering in chat bubbles
- [ ] Display source citations below AI answers
- [ ] Display retrieved textbook images inline in chat
- [ ] Wire student image upload (`📎`) to actual upload + vision flow
- [ ] Handle loading states, error states, empty states

### Phase 5 — Production Hardening (Week 5–6)

- [ ] Rate limiting: max 50 AI messages per student per day (Upstash Redis)
- [ ] Response caching: cache answers for identical queries per class+subject (Redis, 24h TTL)
- [ ] Cost monitoring: track tokens used per student, per day
- [ ] Content filter: reject off-topic questions ("who is Narendra Modi" in a Math chat)
- [ ] Fallback: if RAG context is empty, use Claude's base knowledge with disclaimer
- [ ] Add IVFFlat index with appropriate `lists` value based on row count

---

## 11. Cost Estimates

### Ingestion (One-time)

| Item | Volume | Cost |
|------|--------|------|
| Embedding all text chunks | ~500k chunks × ~300 tokens avg = 150M tokens | ~$3 (text-embedding-3-small at $0.02/1M) |
| Claude Vision image captioning | ~30,000 images × ~200 tokens output | ~$6 |
| Total ingestion | — | **~$10–15** |

### Per Month (Running Cost)

| Item | Assumption | Cost |
|------|-----------|------|
| Student queries — embedding | 10,000 queries/day × 200 tokens = 60M tokens/month | ~$1.20/month |
| Student queries — Claude answer | 10,000 queries/day × 1,000 tokens avg = 300M tokens/month | ~$900/month (Sonnet $3/1M input, $15/1M output) |
| Student image uploads — Claude Vision | 2,000 uploads/day × 1,500 tokens = 90M tokens/month | ~$270/month |
| Supabase Storage | 30,000 images × avg 200KB = 6GB | ~$0.90/month |
| Supabase DB + pgvector | 500k rows + vector index | Included in Pro plan |

> **Optimization:** Cache repeat questions (same question from multiple students) in Redis.
> A cache hit rate of 30% can cut Claude API costs by 30%.

---

## 12. What Makes This Hard

### 1. Hindi, Sanskrit, and Regional Language PDFs

NCERT Hindi PDFs use Devanagari script. PyMuPDF extracts it correctly, but embedding quality depends on the embedding model's multilingual capability. Use `text-embedding-3-small` (handles Hindi well) and test before full ingestion.

### 2. Scanned PDFs (Old NCERT Editions)

Some older NCERT books are image-scans, not text PDFs. PyMuPDF will extract blank text. Solution: detect zero-text pages → run Tesseract OCR (with Hindi support) → use OCR'd text for chunking.

### 3. Math Equations in Text Chunks

NCERT math equations in PDFs often become garbled text (`∫ dx` becomes `? dx`). Solution: for Class 9–12 Math and Science, extract equations as images via PyMuPDF's `get_drawings()` and include them as `book_images` with a caption.

### 4. Image Retrieval Relevance

Not every question needs a textbook image. Avoid always returning 3 images. Add a **relevance threshold**: only return images where similarity score > 0.75. Return 0 images if none cross the threshold.

### 5. Context Window Management

With 5 text chunks at ~500 tokens each + image captions + system prompt, you're at ~4,000 tokens input. For very long student conversations (multi-turn), only include the last 4 messages + fresh retrieval. Do not pass the full chat history to Claude on every message.

### 6. Class 11–12 Stream Isolation

Class 11 Science `Physics 1` and Class 12 Science `Physics 1` are different books. The `stream` + `class_num` + `subject` triple must be exact. Be careful with naming: `Physics 1` (Class 11) vs `Physics Part 1` (Class 12) — normalize these during ingestion.

### 7. Multi-turn Conversation Context

For follow-up questions ("what did you mean by that?" or "explain the second point"), the system needs conversation history. Store the last N messages in the session and include them in the Claude prompt. But do NOT re-embed conversation history — only embed the latest user message for retrieval.

---

## Appendix — Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# OpenAI (embeddings only)
OPENAI_API_KEY=sk-...

# Anthropic (Claude for answers + vision + captioning)
ANTHROPIC_API_KEY=sk-ant-...

# Upstash Redis (rate limiting + caching)
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...

# Ingestion script only
BOOKS_DIR=/path/to/ncert/pdfs
INGESTION_BATCH_SIZE=10
```

---

*This document covers the complete RAG chatbot architecture for EduAI. Cross-reference with `RAG_BACKEND_REQUIREMENTS.md` for the full backend API list and `UI_FEATURES.md` for the frontend chat component specs.*
