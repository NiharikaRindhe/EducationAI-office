# EduAI — New Features Implementation Plan

> **Last updated:** June 29, 2026
> **Features:** AI Proctoring · AI Subjective Scoring · Avatar English Assessment (Batch 1 & 2)

---

## Table of Contents

1. [Feature 1 — AI Proctoring for Exams](#feature-1--ai-proctoring-for-exams)
2. [Feature 2 — AI Scoring for Subjective Answers](#feature-2--ai-scoring-for-subjective-answers)
3. [Feature 3 — Avatar-Guided English Assessment](#feature-3--avatar-guided-english-assessment)
4. [Database Schema — All 3 Features](#database-schema--all-3-features)
5. [API Endpoints — All 3 Features](#api-endpoints--all-3-features)
6. [Implementation Order](#implementation-order)

---

## Feature 1 — AI Proctoring for Exams

### Scope

| Batch | Use Case |
|-------|---------|
| Batch 1 (Class 1–4) | NOT applicable — too young for proctored exams |
| Batch 2 (Class 5–8) | Unit tests, chapter exams — basic proctoring |
| Batch 3 (Class 9–10) | Board practice papers — full proctoring |
| Batch 4 (Class 11–12) | JEE/NEET mocks — full proctoring + strict mode |

### 4 Proctoring Controls

```
┌─────────────────────────────────────────────────────────────┐
│  CONTROL 1: Multi-Face Detection (Client-side, no server)   │
│  CONTROL 2: Gaze / Focus Tracking                           │
│  CONTROL 3: Tab / Window Switch Detection                   │
│  CONTROL 4: Question + Option Randomization (Server-side)   │
└─────────────────────────────────────────────────────────────┘
```

---

### Control 1 — Multi-Face Detection

**How it works:**
- Uses TensorFlow.js `@tensorflow-models/face-detection` — runs entirely in the browser, no video uploaded
- Accesses webcam via `getUserMedia`
- Every 5 seconds: counts faces in frame
  - 0 faces → "Are you still there?" warning
  - 2+ faces → "Multiple people detected" flag → logs violation

**Library:**
```bash
npm install @tensorflow/tfjs @tensorflow-models/face-detection
```

**Implementation (React hook):**
```typescript
// hooks/useFaceDetection.ts
import * as faceDetection from '@tensorflow-models/face-detection';
import '@tensorflow/tfjs-backend-webgl';

export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  onViolation: (type: 'no_face' | 'multiple_faces', count: number) => void
) {
  const detectorRef = useRef<faceDetection.FaceDetector | null>(null);
  const intervalRef = useRef<number>();

  useEffect(() => {
    async function init() {
      const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
      detectorRef.current = await faceDetection.createDetector(model, {
        runtime: 'tfjs',
        maxFaces: 5,
      });

      intervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || !detectorRef.current) return;
        const faces = await detectorRef.current.estimateFaces(videoRef.current);

        if (faces.length === 0) {
          onViolation('no_face', 0);
        } else if (faces.length > 1) {
          onViolation('multiple_faces', faces.length);
        }
      }, 5000); // check every 5 seconds
    }
    init();
    return () => clearInterval(intervalRef.current);
  }, []);
}
```

**In exam UI:**
```typescript
// Small camera feed in top-right corner (100x75px)
// Student can see themselves — transparency builds trust
<div className="fixed top-4 right-4 z-50">
  <video ref={videoRef} width={100} height={75} className="rounded-lg border-2 border-gray-200" autoPlay muted />
  {faceStatus === 'multiple' && (
    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded mt-1 text-center">
      ⚠ Multiple faces detected
    </div>
  )}
</div>
```

---

### Control 2 — Gaze / Focus Tracking

**How it works:**
- Uses `@tensorflow-models/face-landmarks-detection` — tracks 468 facial landmarks
- Estimates eye direction from iris landmarks
- Detects: looking left, right, down, or away for more than 3 seconds continuously
- After 3+ seconds looking away: logs "gaze_away" event

**Gaze estimation logic:**
```typescript
// hooks/useGazeTracking.ts
import * as faceLandmarks from '@tensorflow-models/face-landmarks-detection';

function estimateGaze(keypoints: any[]): 'center' | 'left' | 'right' | 'down' {
  // Left iris center: landmarks[468]
  // Right iris center: landmarks[473]
  // Left eye corners: landmarks[33] (left), landmarks[133] (right)
  const leftIris  = keypoints[468];
  const rightIris = keypoints[473];
  const leftEyeLeft   = keypoints[33];
  const leftEyeRight  = keypoints[133];

  // Iris position as ratio within eye width
  const eyeWidth = leftEyeRight.x - leftEyeLeft.x;
  const irisOffset = leftIris.x - leftEyeLeft.x;
  const ratio = irisOffset / eyeWidth;

  if (ratio < 0.35) return 'left';
  if (ratio > 0.65) return 'right';
  return 'center';
}
```

**Thresholds (configurable per exam):**

| Sensitivity | Away Duration Before Flag |
|------------|--------------------------|
| Low (default Batch 2) | 5 seconds |
| Medium (Batch 3 Board) | 4 seconds |
| High (Batch 4 JEE/NEET) | 3 seconds |

---

### Control 3 — Tab / Window Switch Detection

**Implementation — no library needed, pure browser events:**

```typescript
// hooks/useTabSwitchDetection.ts
export function useTabSwitchDetection(
  onSwitch: (count: number) => void
) {
  const switchCount = useRef(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        switchCount.current += 1;
        onSwitch(switchCount.current);
      }
    };

    const handleBlur = () => {
      // Window lost focus (alt+tab, clicked outside browser)
      switchCount.current += 1;
      onSwitch(switchCount.current);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return switchCount;
}
```

**Violation thresholds:**

| Switch Count | Action |
|-------------|--------|
| 1st switch | Warning toast: "Switching tabs is not allowed during the exam" |
| 2nd switch | Second warning + logged as violation |
| 3rd switch | Exam auto-submits with current answers + flagged for teacher review |

---

### Control 4 — Question + Option Randomization

**How it works:**
- Server generates a unique `seed` for each student × exam combination
- Seed deterministically shuffles questions and options
- Same student gets same shuffle on refresh (so if they reload, it's consistent)
- Two students sitting next to each other see completely different paper

**Implementation (server-side):**
```typescript
// Seeded shuffle using student_id + exam_id as seed
function seededShuffle<T>(arr: T[], seed: string): T[] {
  // Simple mulberry32 PRNG
  let s = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// API: GET /api/exam/:id/paper?student_id=xxx
const seed = `${examId}-${studentId}`;
const shuffledQuestions = seededShuffle(exam.questions, seed);
const shuffledWithOptions = shuffledQuestions.map(q => ({
  ...q,
  options: q.type === 'MCQ' ? seededShuffle(q.options, seed + q.id) : q.options
}));
```

---

### Proctoring Event Logging

Every violation is saved to the DB in real-time:

```typescript
// POST /api/proctor/event  (called from client on every violation)
{
  exam_submission_id: string,
  event_type: 'no_face' | 'multiple_faces' | 'gaze_away' | 'tab_switch',
  severity: 'warning' | 'violation',
  metadata: {
    face_count?: number,
    gaze_direction?: string,
    switch_count?: number,
    timestamp: ISO8601
  }
}
```

### Proctoring Report (Teacher View)

After exam ends, teacher sees for each student:

```
┌──────────────────────────────────────────────────────┐
│  Aisha Sharma — Class 9A — Science Mock              │
│  Score: 42/50                                        │
│                                                      │
│  PROCTORING REPORT:                                  │
│  ⚠ Tab switches:        2  (Warning threshold: 3)   │
│  ⚠ Gaze away events:   4  (>3 sec each)             │
│  ✓ Face violations:    0                             │
│  Status: CLEAN  |  FLAGGED  |  AUTO-SUBMITTED        │
│                                                      │
│  Timeline:                                           │
│  09:12:34 — Tab switch #1                           │
│  09:18:41 — Gaze away (4.2 sec)                    │
│  09:23:15 — Tab switch #2                           │
└──────────────────────────────────────────────────────┘
```

### Camera Permission UX

Before exam starts:
1. Pre-flight screen: "This exam uses webcam proctoring. Allow camera access to proceed."
2. Camera permission request
3. Test frame shown: "We can see you clearly" / "No face detected — adjust your camera"
4. Countdown: "Exam starts in 3... 2... 1..."

If student denies camera:
- Teacher configured: "Camera required" → exam blocked with message
- Teacher configured: "Camera optional" → exam continues without proctoring (flagged as "unproctored")

---

### New UI Components Needed

| Component | Route | Purpose |
|-----------|-------|---------|
| `ProctorSetup` | Shown before any proctored exam | Camera check, instructions |
| `ProctorOverlay` | Floating during exam | Mini camera feed + violation warnings |
| `ProctorReport` | `/teacher/reports` — per student | Violation timeline for teacher |
| `ExamSettings` — proctoring toggle | `/teacher/create-exam` | Teacher enables/disables proctoring |

### Teacher Exam Settings — New Proctoring Section

```
┌─────────────────────────────────────────┐
│  PROCTORING SETTINGS                    │
│                                         │
│  ☐ Enable webcam proctoring            │
│  ☐ Enable gaze tracking                │
│  ☐ Auto-submit on 3rd tab switch       │
│  ☐ Randomize questions                 │
│  ☐ Shuffle answer options              │
│                                         │
│  Camera requirement:                    │
│  ● Required  ○ Optional  ○ Disabled    │
│                                         │
│  Gaze sensitivity:                      │
│  ○ Low (5s)  ● Medium (4s)  ○ High (3s)│
└─────────────────────────────────────────┘
```

---

## Feature 2 — AI Scoring for Subjective Answers

### Scope

| Batch | Question Types Scored |
|-------|----------------------|
| Batch 1 (Class 1–4) | Not applicable |
| Batch 2 (Class 5–8) | Short Answer (2–3 marks), Long Answer (5 marks) |
| Batch 3 (Class 9–10) | Short Answer (3 marks), Long Answer (5 marks), Case Study (4 marks) |
| Batch 4 (Class 11–12) | Short Answer (2 marks), Long Answer (5 marks), Numerical with explanation |

---

### How It Works — End to End

```
TEACHER (Exam Creation):
  Creates question → type = "Short Answer" or "Long Answer"
  Fills in:
    · Marks: 5
    · Rubric / Marking Scheme:
      "Award 1 mark for defining photosynthesis.
       Award 2 marks for correctly listing reactants (CO2, H2O, light).
       Award 1 mark for the balanced equation.
       Award 1 mark for naming chlorophyll as catalyst."

STUDENT (Exam Submission):
  Types their answer in the text area.
  Clicks "Submit Exam"

BACKEND (Immediately after submission):
  For each short/long answer question:
    → Calls Claude API with {question, rubric, student_answer, max_marks}
    → Receives: { ai_score, covered_points, missing_points, feedback }
    → Saves to DB (exam_answers table)

TEACHER (Review):
  Opens student's submission
  Sees:
    · Student's answer (full text)
    · AI suggested score: 3/5
    · Points covered: ✓ Definition, ✓ Reactants, ✓ Equation
    · Points missed: ✗ No mention of chlorophyll
    · AI feedback: "Good attempt. Missed catalyst detail."
  Teacher can:
    · Accept AI score (click ✓)
    · Override with their own score (type in input)
    · Add a comment
  Clicks "Finalise Score"
```

---

### Claude API Call — Scoring Prompt

```typescript
async function scoreSubjectiveAnswer(
  question: string,
  rubric: string,
  studentAnswer: string,
  maxMarks: number,
  classNum: number,
  subject: string
): Promise<AIScore> {

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: `You are a CBSE examiner for Class ${classNum} ${subject}.
             Score the student's answer strictly according to the marking scheme provided.
             Be fair but strict — award marks only for explicitly stated correct content.
             Return ONLY valid JSON in this exact format:
             {
               "score": <number between 0 and ${maxMarks}>,
               "covered_points": ["point 1", "point 2"],
               "missing_points": ["point A", "point B"],
               "feedback": "<one sentence of constructive feedback for the student>"
             }`,
    messages: [{
      role: 'user',
      content: `QUESTION: ${question}

MARKING SCHEME (${maxMarks} marks total):
${rubric}

STUDENT'S ANSWER:
${studentAnswer}

Score this answer and return JSON.`
    }]
  });

  return JSON.parse(response.content[0].text) as AIScore;
}
```

---

### Teacher — Exam Builder Changes

Add rubric field when teacher selects "Short Answer" or "Long Answer" question type:

```
┌──────────────────────────────────────────────────────┐
│  Question Type: [Long Answer ▼]    Marks: [5]        │
│                                                      │
│  Question:                                           │
│  ┌──────────────────────────────────────────────┐   │
│  │ Explain the process of photosynthesis with   │   │
│  │ a labelled diagram.                          │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Marking Scheme / Rubric: (Used for AI scoring)      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 1 mark — Definition of photosynthesis        │   │
│  │ 2 marks — Reactants (CO2, H2O, sunlight)     │   │
│  │ 1 mark — Balanced equation                   │   │
│  │ 1 mark — Role of chlorophyll                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  AI Scoring: ● Enabled  ○ Manual only               │
│                                                      │
│  [+ Add Question]                                    │
└──────────────────────────────────────────────────────┘
```

---

### Student — Exam UI Changes

For Short/Long Answer questions, student sees a textarea:

```
┌──────────────────────────────────────────────────────┐
│  Q4. Explain the process of photosynthesis.  [5 marks]│
│                                                      │
│  Your Answer:                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │  Photosynthesis is the process by which...  │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│  234 / 500 words                                     │
└──────────────────────────────────────────────────────┘
```

---

### Teacher — Submission Review UI

New view: `/teacher/exam/:id/submission/:student_id`

```
┌──────────────────────────────────────────────────────────────────┐
│  Aisha Sharma — Science — Chapter 6 Exam                         │
│  Submitted: Jun 29, 10:34 AM    Overall: 38/50 (pending review)  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Q1. [MCQ] What is the product of photosynthesis?                │
│  ✓ Correct — 2/2 marks (auto-graded)                            │
│                                                                  │
│  Q4. [Long Answer] Explain photosynthesis.  Max: 5 marks         │
│                                                                  │
│  Student's Answer:                                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Photosynthesis is the process by which green plants    │     │
│  │ use sunlight, water and carbon dioxide to make food.   │     │
│  │ The equation is 6CO2 + 6H2O → C6H12O6 + 6O2.         │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  🤖 AI Pre-Score: 3 / 5                                          │
│  ✓ Covered: Definition · Balanced equation · CO2 and H2O        │
│  ✗ Missed:  Role of chlorophyll · Sunlight not specified         │
│  💬 Feedback: "Good base answer. Missing chlorophyll's role."    │
│                                                                  │
│  Teacher Score:  [3] / 5   ← editable                           │
│  Teacher Note:   [____________] optional                         │
│                                                                  │
│  [✓ Accept AI Score]   [Save My Score]                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### What Gets Stored in DB

```typescript
// exam_answers table
{
  id: uuid,
  exam_submission_id: uuid,
  question_id: uuid,
  student_answer: string,          // raw text
  max_marks: number,

  // AI scoring (populated immediately after submission)
  ai_score: number,
  ai_covered_points: string[],
  ai_missing_points: string[],
  ai_feedback: string,
  ai_scored_at: timestamp,

  // Teacher review (populated when teacher reviews)
  final_score: number,             // teacher accepted/overridden score
  teacher_note: string,
  teacher_reviewed_at: timestamp,
  teacher_overrode_ai: boolean,    // analytics: how often teachers disagree with AI

  created_at: timestamp
}
```

---

## Feature 3 — Avatar-Guided English Assessment (Batch 1 & 2)

### Overview

An interactive English assessment where a friendly animated avatar guides students through:
- **Batch 1 (Class 1–4):** Word-level — avatar reads a word, student repeats it, AI scores pronunciation
- **Batch 2 (Class 5–8):** Sentence-level — avatar presents a sentence, student reads it aloud, AI scores fluency + accuracy

### Routes

```
/batch1/english-assessment    — Word pronunciation & identification (Class 1–4)
/batch2/english-assessment    — Sentence reading & comprehension (Class 5–8)
```

---

### The Avatar Character

The avatar is a **large animated CSS/SVG character** styled around the student's chosen emoji avatar (🦁🐯🦊🐼🐸🦋🦄🐉).

**Avatar states with CSS animations:**

| State | Animation | Trigger |
|-------|-----------|---------|
| `idle` | Gentle bobbing up and down | Default |
| `speaking` | Mouth open/close loop + sound waves appear | When TTS plays |
| `listening` | Ear animation + pulse ring | When recording student |
| `happy` | Jump + sparkles | Correct answer |
| `encouraging` | Head tilt + wave | Incorrect — try again |
| `celebrating` | Spin + confetti | Assessment complete |

**Avatar implementation (CSS keyframes):**
```css
@keyframes avatar-bob {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes avatar-speak {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.3); } /* mouth squish = talking */
}

@keyframes avatar-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
}

.avatar-idle { animation: avatar-bob 2s ease-in-out infinite; }
.avatar-speaking { animation: avatar-speak 0.3s ease-in-out infinite; }
.avatar-listening { animation: avatar-pulse 1.5s ease-in-out infinite; }
```

---

### Batch 1 — Word Assessment Flow

**Content source:** NCERT Class 1–4 English (Marigold) vocabulary list — words grouped by unit and chapter.

**Assessment types for Batch 1:**

| Type | What student does | How scored |
|------|-----------------|-----------|
| **Hear & Repeat** | Avatar says a word → student repeats it into mic | Pronunciation accuracy via Whisper |
| **See & Say** | Word shown on screen → student reads it aloud | Word recognition + pronunciation |
| **Match the Sound** | 4 words shown → avatar says one → student taps the right word | Comprehension (no mic needed) |
| **Spell It Out** | Avatar spells a word letter by letter → student says the full word | Phonics blending |

**Screen layout — Batch 1:**

```
┌────────────────────────────────────────────────────────────┐
│  English Practice                    Level 2 · Unit 3       │
│  ⭐⭐⭐ Stars: 12                                           │
│                                                            │
│              🦊                                            │
│         [AVATAR - large, center]                           │
│            (speaking animation)                            │
│                                                            │
│   ┌──────────────────────────────────┐                     │
│   │          BUTTERFLY               │  ← word shown       │
│   └──────────────────────────────────┘                     │
│                                                            │
│   "Can you say this word?"                                 │
│                                                            │
│        ┌──────────────────┐                                │
│        │  🎤  TAP TO SPEAK │  ← large button              │
│        └──────────────────┘                                │
│                                                            │
│   [◀ Back]                          [Skip this word ▶]    │
└────────────────────────────────────────────────────────────┘
```

**Audio flow (Batch 1):**
```typescript
// 1. Avatar "says" the word using Web Speech API (free, no API cost)
function avatarSpeak(word: string, onEnd: () => void) {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-IN';
  utterance.rate = 0.8;   // slower for young children
  utterance.pitch = 1.2;  // slightly higher pitch, friendlier
  utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

// 2. Student taps the mic button → recording starts
// Uses MediaRecorder API → records for up to 5 seconds
// On silence detection or tap-to-stop → sends audio to backend

// 3. Backend: Whisper transcribes → Claude compares to target word
async function scoreWordPronunciation(
  audioBlob: Blob,
  targetWord: string
): Promise<WordScore> {
  // Upload audio → Whisper API → get transcription
  const transcript = await transcribeAudio(audioBlob);

  // Compare transcript to target word
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `A Class 2 student was asked to say the word "${targetWord}".
                The speech recognition heard: "${transcript}".
                Score the pronunciation:
                - "correct": clearly said the right word
                - "close": said something similar (minor error)
                - "incorrect": said a different word or nothing
                Return JSON: { "result": "correct"|"close"|"incorrect", "feedback": "one short encouraging sentence" }`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

**Feedback shown to student:**

| Result | Avatar reaction | Message |
|--------|----------------|---------|
| `correct` | 🎉 Happy jump + confetti | "Amazing! You said it perfectly!" |
| `close` | 👍 Thumbs up + gentle nod | "Almost! Try saying it one more time!" |
| `incorrect` | 🤗 Encouraging wave | "Let's try again together!" → replays word |

---

### Batch 2 — Sentence Reading Assessment Flow

**Content source:** NCERT Class 5–8 English (Honeycomb, It So Happened) — chapter passages.

**Assessment types for Batch 2:**

| Type | What student does | How scored |
|------|-----------------|-----------|
| **Read Aloud** | Sentence shown → student reads it → AI scores fluency | Words per minute, accuracy |
| **Passage Reading** | 5–6 sentence paragraph → student reads entire passage | Fluency + expression + accuracy |
| **Listen & Respond** | Avatar reads a question about a passage → student answers orally | Comprehension + speaking |
| **Fill & Speak** | Sentence with one blank shown → student completes and speaks it | Grammar + pronunciation |

**Screen layout — Batch 2:**

```
┌────────────────────────────────────────────────────────────┐
│  English Reading Assessment          Class 7 · Chapter 3    │
│  Progress: ●●●○○  (3/5)                                    │
│                                                            │
│     🦋                                                     │
│  [AVATAR - medium size, left side]                         │
│  "Read this sentence aloud when ready:"                    │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │                                                  │     │
│  │  "The children ran across the field,             │     │
│  │   laughing and shouting with joy."               │     │
│  │                                                  │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌────────────┐    ┌──────────────┐    ┌─────────────┐    │
│  │ 🔊 Hear it │    │ 🎤 Read Now  │    │ ⏭ Skip      │    │
│  └────────────┘    └──────────────┘    └─────────────┘    │
│                                                            │
│  Recording... ████████░░ 4.2 sec                          │
└────────────────────────────────────────────────────────────┘
```

**Fluency scoring for Batch 2:**
```typescript
async function scoreSentenceReading(
  audioBlob: Blob,
  targetSentence: string,
  classNum: number
): Promise<FluencyScore> {

  const transcript = await transcribeAudio(audioBlob);
  const durationSeconds = await getAudioDuration(audioBlob);
  const wordCount = targetSentence.split(' ').length;
  const wordsPerMinute = (wordCount / durationSeconds) * 60;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `A Class ${classNum} student read this sentence aloud:
                Target: "${targetSentence}"
                What was heard: "${transcript}"
                Reading speed: ${Math.round(wordsPerMinute)} words per minute

                Evaluate:
                1. Accuracy (0-10): Did they say the right words?
                2. Fluency (0-10): Was the pace appropriate? (expected 80-120 WPM for class ${classNum})
                3. Missing/wrong words: list them

                Return JSON:
                {
                  "accuracy_score": 0-10,
                  "fluency_score": 0-10,
                  "wrong_words": ["word1", "word2"],
                  "feedback": "one short encouraging sentence for a Class ${classNum} student"
                }`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

---

### Progress & Gamification for English Assessment

Both Batch 1 and Batch 2 English assessments tie into the existing XP and badge system:

| Achievement | XP | Badge |
|-------------|-----|-------|
| Complete 1 word set (10 words) | +20 XP | — |
| Score 90%+ on a word set | +50 XP | ⭐ "Word Master" badge |
| Complete first sentence reading | +30 XP | — |
| Score "Excellent" on passage | +80 XP | 📖 "Fluent Reader" badge |
| 7-day English streak | +100 XP | 🎤 "Speaking Star" badge |

---

### Assessment Report for Teachers

Teachers see a class-level English reading report at `/teacher/reports` → English tab:

```
┌──────────────────────────────────────────────────────────────┐
│  Class 7A — English Reading Assessment Report                │
│  Period: This Month                                          │
├──────────────────┬────────────┬────────────┬────────────────┤
│  Student         │ Accuracy   │ Fluency    │ WPM            │
├──────────────────┼────────────┼────────────┼────────────────┤
│  Aisha Sharma    │  92%  🟢  │  88%  🟢  │  112 wpm       │
│  Dev Kumar       │  74%  🟡  │  68%  🟡  │  79 wpm        │
│  Meera Patel     │  61%  🔴  │  55%  🔴  │  63 wpm        │
│  Riya Singh      │  89%  🟢  │  91%  🟢  │  118 wpm       │
├──────────────────┴────────────┴────────────┴────────────────┤
│  Class Average:  Accuracy 79% · Fluency 75% · 93 WPM        │
│  ⚠ Needs attention: Dev Kumar, Meera Patel (below 70%)      │
└──────────────────────────────────────────────────────────────┘
```

---

### Parent View — English Assessment

Parents see a simplified version in `/parent/child-progress` → English tab:

```
┌──────────────────────────────────────────┐
│  Dev's English Reading Progress          │
│                                          │
│  Reading Accuracy:    74%  ████████░░    │
│  Reading Fluency:     68%  ███████░░░    │
│  Speaking Speed:      79 words/min       │
│                                          │
│  This week: Completed 3 word sets        │
│  Stars earned: ⭐⭐⭐ (Word Master!)     │
│                                          │
│  Teacher tip: "Practice reading 10 min  │
│  aloud daily to improve fluency."        │
└──────────────────────────────────────────┘
```

---

## Database Schema — All 3 Features

```sql
-- ─────────────────────────────────────────────────────────────
--  PROCTORING
-- ─────────────────────────────────────────────────────────────

CREATE TABLE proctoring_settings (
  exam_id               UUID PRIMARY KEY REFERENCES exams(id),
  enabled               BOOLEAN DEFAULT false,
  camera_required       TEXT DEFAULT 'optional'  -- 'required' | 'optional' | 'disabled'
                          CHECK (camera_required IN ('required', 'optional', 'disabled')),
  gaze_tracking         BOOLEAN DEFAULT true,
  auto_submit_on_switch BOOLEAN DEFAULT true,
  switch_limit          INT DEFAULT 3,
  randomize_questions   BOOLEAN DEFAULT true,
  shuffle_options       BOOLEAN DEFAULT true,
  gaze_sensitivity_sec  INT DEFAULT 4  -- seconds before gaze_away is flagged
);

CREATE TABLE proctoring_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_submission_id    UUID NOT NULL REFERENCES exam_submissions(id),
  event_type            TEXT NOT NULL
                          CHECK (event_type IN ('no_face','multiple_faces','gaze_away','tab_switch')),
  severity              TEXT NOT NULL CHECK (severity IN ('warning','violation')),
  metadata              JSONB,    -- { face_count, gaze_direction, switch_count }
  occurred_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON proctoring_events (exam_submission_id, occurred_at);

-- ─────────────────────────────────────────────────────────────
--  AI SUBJECTIVE SCORING
-- ─────────────────────────────────────────────────────────────

CREATE TABLE exam_answers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_submission_id    UUID NOT NULL REFERENCES exam_submissions(id),
  question_id           UUID NOT NULL REFERENCES questions(id),
  student_answer        TEXT,
  max_marks             INT NOT NULL,

  -- AI scoring
  ai_score              NUMERIC(4,1),
  ai_covered_points     TEXT[],
  ai_missing_points     TEXT[],
  ai_feedback           TEXT,
  ai_scored_at          TIMESTAMPTZ,

  -- Teacher review
  final_score           NUMERIC(4,1),
  teacher_note          TEXT,
  teacher_reviewed_at   TIMESTAMPTZ,
  teacher_overrode_ai   BOOLEAN DEFAULT false,

  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Add rubric column to questions table
ALTER TABLE questions ADD COLUMN rubric TEXT;
ALTER TABLE questions ADD COLUMN ai_scoring_enabled BOOLEAN DEFAULT true;

-- ─────────────────────────────────────────────────────────────
--  ENGLISH ASSESSMENT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE english_assessment_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_num     INT NOT NULL CHECK (class_num BETWEEN 1 AND 8),
  type          TEXT NOT NULL
                  CHECK (type IN ('word_repeat','word_see_say','sentence_read','passage_read','listen_respond')),
  content       TEXT NOT NULL,    -- the word or sentence
  audio_url     TEXT,             -- pre-recorded avatar audio (optional)
  difficulty    TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  unit          TEXT,             -- NCERT unit reference
  chapter       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE english_assessment_attempts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES auth.users(id),
  item_id             UUID NOT NULL REFERENCES english_assessment_items(id),
  class_num           INT NOT NULL,
  audio_url           TEXT,             -- student's recorded audio (Supabase Storage)
  transcript          TEXT,             -- Whisper output
  accuracy_score      INT,              -- 0-10
  fluency_score       INT,              -- 0-10
  wpm                 INT,              -- words per minute (sentence/passage only)
  ai_feedback         TEXT,
  result              TEXT,             -- 'correct' | 'close' | 'incorrect' (word level)
  xp_earned          INT DEFAULT 0,
  attempted_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON english_assessment_attempts (student_id, attempted_at);
CREATE INDEX ON english_assessment_attempts (class_num, result);

-- Word/sentence content pre-seeded from NCERT (run once)
-- Sample inserts:
INSERT INTO english_assessment_items (class_num, type, content, unit, chapter) VALUES
  (1, 'word_repeat',    'butterfly',   'Unit 1', 'Marigold Ch 1'),
  (1, 'word_see_say',   'elephant',    'Unit 2', 'Marigold Ch 2'),
  (2, 'word_repeat',    'beautiful',   'Unit 1', 'Marigold Ch 3'),
  (5, 'sentence_read',  'The sun rises in the east every morning.', 'Unit 1', 'Marigold Ch 1'),
  (7, 'sentence_read',  'The children ran across the field, laughing and shouting with joy.', 'Unit 3', 'Honeycomb Ch 3'),
  (7, 'passage_read',   'Once upon a time, there lived a wise old man in a small village...', 'Unit 2', 'It So Happened Ch 2');
```

---

## API Endpoints — All 3 Features

### Proctoring

```
POST /api/proctor/event
  Body: { exam_submission_id, event_type, severity, metadata }
  → Logs violation event in real-time

GET  /api/proctor/report/:exam_submission_id
  → Returns full violation timeline for teacher view
  → { events[], summary: { tab_switches, gaze_events, face_violations, status } }

GET  /api/proctor/report/exam/:exam_id
  → Returns proctoring summary for ALL students in an exam (teacher overview)
```

### AI Subjective Scoring

```
POST /api/exam/score-answer
  Body: { exam_submission_id, question_id, student_answer }
  → Calls Claude, returns AI score
  → { ai_score, covered_points, missing_points, feedback }
  Note: Called automatically server-side after student submits exam

PUT  /api/exam/finalize-score
  Body: { exam_answer_id, final_score, teacher_note }
  → Teacher accepts or overrides AI score
  → Updates final_score + teacher_reviewed_at
```

### English Assessment

```
GET  /api/english-assessment/items?class_num=7&type=sentence_read&limit=5
  → Returns 5 random sentence items for Class 7

POST /api/english-assessment/submit
  Body: { item_id, student_id, audio_base64, class_num }
  → Transcribes audio (Whisper)
  → Scores via Claude
  → Saves attempt + awards XP
  → Returns: { transcript, accuracy_score, fluency_score, wpm, ai_feedback, result, xp_earned }

GET  /api/english-assessment/progress?student_id=xxx&class_num=7
  → Returns student's overall English assessment stats
  → { avg_accuracy, avg_fluency, avg_wpm, attempts_this_week, badges_earned }

GET  /api/english-assessment/class-report?class_num=7&teacher_id=xxx
  → Returns class-level report for teacher
  → { students: [{ name, accuracy, fluency, wpm }], class_avg, needs_attention: [] }
```

---

## Implementation Order

```
Week 1 — Proctoring Basics (no ML yet)
  ✅ Tab switch detection (visibilitychange + blur)
  ✅ Question randomization (seeded shuffle on exam fetch)
  ✅ Option shuffling
  ✅ Proctoring events table + logging API
  ✅ Add proctoring settings to teacher exam builder
  ✅ Proctoring report in teacher view

Week 2 — Proctoring AI (face + gaze)
  🔲 TensorFlow.js face detection setup
  🔲 Camera permission + pre-flight check UI
  🔲 Multi-face detection hook
  🔲 Gaze tracking hook
  🔲 ProctorOverlay component (mini camera view during exam)

Week 3 — AI Subjective Scoring
  🔲 Add rubric field to teacher exam builder
  🔲 exam_answers table migration
  🔲 POST /api/exam/score-answer (Claude call)
  🔲 Auto-trigger scoring on exam submission
  🔲 Teacher submission review UI with AI pre-score + override

Week 4 — English Assessment (Batch 1)
  🔲 Word assessment items seeded from NCERT Class 1–4
  🔲 Avatar character (CSS animated, tied to student emoji)
  🔲 Hear & Repeat flow (TTS + mic recording)
  🔲 See & Say flow
  🔲 Whisper transcription + Claude word scoring
  🔲 XP + badge integration

Week 5 — English Assessment (Batch 2)
  🔲 Sentence items seeded from NCERT Class 5–8
  🔲 Sentence Read Aloud flow (MediaRecorder)
  🔲 Fluency scoring (WPM + accuracy via Claude)
  🔲 Class report for teachers
  🔲 Parent view in child-progress → English tab
```

---

*Cross-reference: RAG_CHATBOT_ARCHITECTURE.md for AI infrastructure. Backend stack uses Node.js API (Railway) + Supabase DB + Supabase Storage. Claude claude-sonnet-4-6 for all AI scoring and evaluation.*
