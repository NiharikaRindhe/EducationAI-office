import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { chatCompletion, embedText, aiConfigured } from '../lib/ai.js';
import type { CreateChatSessionInput, RenameChatSessionInput } from '../schemas/chat.schema.js';

async function requireWhitelistedSubject(classNum: number, subject: string) {
  const { data } = await supabaseAdmin
    .from('class_subjects')
    .select('subject')
    .eq('class_num', classNum)
    .eq('subject', subject)
    .maybeSingle();
  if (!data) throw new ApiError('SUBJECT_NOT_WHITELISTED', `${subject} is not offered for Class ${classNum}`);
}

/** Powers the subject picker in Chat/Notes — the same class_subjects
 *  whitelist every task/exam/chat validates against, scoped to this
 *  student's own class so they never see an invalid option. */
export async function listMySubjects(studentId: string) {
  const { data: sp, error: spError } = await supabaseAdmin
    .from('student_profiles')
    .select('class_num')
    .eq('user_id', studentId)
    .single();
  if (spError || !sp) throw new ApiError('NOT_FOUND', 'Student profile not found');

  const { data, error } = await supabaseAdmin
    .from('class_subjects')
    .select('subject')
    .eq('class_num', sp.class_num)
    .order('subject');
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list subjects', error.message);
  return (data ?? []).map((r) => r.subject as string);
}

export async function createSession(studentId: string, input: CreateChatSessionInput) {
  // The session's class is ALWAYS the student's own class from their profile —
  // never the client-supplied value. This is what guarantees a Class 5 student's
  // RAG retrieval can only ever hit Class 5 chunks, even for topics that also
  // exist in Class 7 books (same trust boundary as games/exams).
  const { data: sp, error: spError } = await supabaseAdmin
    .from('student_profiles')
    .select('class_num')
    .eq('user_id', studentId)
    .single();
  if (spError || !sp) throw new ApiError('NOT_FOUND', 'Student profile not found');

  await requireWhitelistedSubject(sp.class_num, input.subject);

  const { data, error } = await supabaseAdmin
    .from('chat_sessions')
    .insert({ student_id: studentId, class_num: sp.class_num, subject: input.subject })
    .select()
    .single();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to create chat session', error.message);
  return data;
}

export async function listSessions(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from('chat_sessions')
    .select('id, class_num, subject, title, created_at, updated_at')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list chat sessions', error.message);
  return data;
}

/** Student-chosen label, e.g. "Chapter 2 doubts" — falls back to the subject
 *  in the UI when null, so this is purely additive and never required. */
export async function renameSession(studentId: string, sessionId: string, input: RenameChatSessionInput) {
  const { data, error } = await supabaseAdmin
    .from('chat_sessions')
    .update({ title: input.title })
    .eq('id', sessionId)
    .eq('student_id', studentId)
    .select('id, class_num, subject, title, created_at, updated_at')
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to rename chat session', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Chat session not found');
  return data;
}

/** chat_messages.session_id is ON DELETE CASCADE, so the whole conversation
 *  goes with it in one statement — no separate cleanup step to forget. */
export async function deleteSession(studentId: string, sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('student_id', studentId)
    .select('id')
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to delete chat session', error.message);
  if (!data) throw new ApiError('NOT_FOUND', 'Chat session not found');
}

export async function getHistory(studentId: string, sessionId: string) {
  const { data: session } = await supabaseAdmin
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (!session) throw new ApiError('NOT_FOUND', 'Chat session not found');

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load chat history', error.message);
  return data;
}

interface TextSource {
  content: string;
  book_title: string;
  chapter_num: number | null;
  chapter_title: string | null;
  page_num: number | null;
  similarity: number;
}

interface ImageSource {
  image_url: string;
  caption: string | null;
  chapter_title: string | null;
  page_num: number | null;
  similarity: number;
}

/** Uploads a student's doubt photo to Storage; returns its public URL.
 *  Chat history renders it back via chat_messages.image_url. */
async function storeChatImage(sessionId: string, imageBase64: string): Promise<string | null> {
  const path = `${sessionId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabaseAdmin.storage
    .from('chat-uploads')
    .upload(path, Buffer.from(imageBase64, 'base64'), { contentType: 'image/jpeg' });
  if (error) return null; // history loses the thumbnail, the answer still works
  return supabaseAdmin.storage.from('chat-uploads').getPublicUrl(path).data.publicUrl;
}

/** Recent-turn window handed to the LLM alongside the system prompt, so a
 *  follow-up like "explain that part again" or "what about the second one"
 *  actually resolves — without it, every message was answered with zero
 *  memory of the conversation so far. Capped (not "the whole session") so
 *  token cost per message stays flat as a session grows to 30+ turns instead
 *  of climbing with it; 6 messages (~3 exchanges) is enough for the kind of
 *  short clarifying follow-up a student actually sends, not enough to make
 *  every message in a long session re-pay for the whole thread. */
const HISTORY_TURNS = 6;
/** Per-message cap so one earlier long explanation can't alone swallow most
 *  of the history budget above — trimmed, not dropped, so the gist survives. */
const HISTORY_CHAR_CAP = 600;

export async function sendMessage(studentId: string, sessionId: string, text: string, imageBase64?: string) {
  const { data: session } = await supabaseAdmin
    .from('chat_sessions')
    .select('id, class_num, subject')
    .eq('id', sessionId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (!session) throw new ApiError('NOT_FOUND', 'Chat session not found');

  const { data: studentProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('school_id')
    .eq('id', studentId)
    .maybeSingle();
  const usageContext = { schoolId: studentProfile?.school_id ?? null, userId: studentId };

  // Fetched BEFORE inserting this turn's user message, so it's exactly the
  // prior conversation — never the message we're about to answer.
  const { data: priorMessages } = await supabaseAdmin
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_TURNS);

  const conversationHistory = (priorMessages ?? [])
    .reverse()
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content:
        (m.content ?? '').trim().slice(0, HISTORY_CHAR_CAP) ||
        (m.role === 'user' ? '[Student shared a photo of a question]' : '(no reply text)'),
    }));

  const imageUrl = imageBase64 ? await storeChatImage(sessionId, imageBase64) : null;
  await supabaseAdmin
    .from('chat_messages')
    .insert({ session_id: sessionId, role: 'user', content: text, image_url: imageUrl });

  if (!(await aiConfigured())) {
    const fallback =
      "I can't reach the AI tutor right now — please try again in a moment, or ask your teacher for help.";
    await supabaseAdmin.from('chat_messages').insert({ session_id: sessionId, role: 'assistant', content: fallback });
    return { answer: fallback, sources: [], returnedImages: [], imageUrl };
  }

  // RAG retrieval needs a text query. A photo-only doubt ("explain this")
  // gets one vision pass to transcribe what the photo asks, and THAT drives
  // retrieval — so a snapped textbook problem still pulls the right chunks.
  let retrievalQuery = text.trim();
  if (!retrievalQuery && imageBase64) {
    try {
      retrievalQuery = await chatCompletion(
        [
          {
            role: 'user',
            content:
              'Transcribe the question or problem shown in this photo as plain text (include any equations in LaTeX). Reply with ONLY the transcription, no commentary.',
            images: [imageBase64],
          },
        ],
        { tier: 'vision', usageContext },
      );
    } catch {
      retrievalQuery = `A Class ${session.class_num} ${session.subject} question shown in a photo`;
    }
  }

  const queryEmbedding = await embedText(retrievalQuery);

  const [textResult, imageResult, crossSubjectResult] = await Promise.all([
    supabaseAdmin.rpc('search_text_chunks', {
      query_embedding: queryEmbedding,
      match_class: session.class_num,
      match_subject: session.subject,
      match_count: 8,
    }),
    supabaseAdmin.rpc('search_book_images', {
      query_embedding: queryEmbedding,
      match_class: session.class_num,
      match_subject: session.subject,
      match_count: 6,
    }),
    supabaseAdmin.rpc('search_text_chunks_cross_subject', {
      query_embedding: queryEmbedding,
      match_class: session.class_num,
      exclude_subject: session.subject,
      match_count: 1,
    }),
  ]);

  const textChunks = (textResult.data ?? []) as TextSource[];
  // A figure with no real "Fig X.Y ..." caption was embedded at ingest time on
  // a generic fallback ("<book> figure, page N") because chapter/caption
  // detection didn't find one nearby — that text describes WHERE the image
  // is, not WHAT it shows, so a similarity match on it is coincidental, not
  // evidence of relevance. Ingestion still uploads and stores the figure
  // (it may be a perfectly good picture), but only a genuinely captioned
  // match is trustworthy enough to actually show a student as "the diagram
  // for this question" — never surface a picture we can't actually vouch
  // for, even if the vector search happened to rank it highly.
  const bookImages = ((imageResult.data ?? []) as ImageSource[])
    .filter((i) => i.caption && i.caption.trim().length > 0)
    .slice(0, 3);

  // Chats stay locked to one subject — that lock is what scopes retrieval to
  // the right book for a class, a real safety property, not just tidiness —
  // but a student can still type a Mathematics question into their Science
  // chat. Rather than silently answer with no grounding, check whether a
  // DIFFERENT subject's content matches meaningfully better than this
  // subject's own best match; if so, flag it. Margin-based (not just "cross
  // subject found something") so a genuinely on-subject question with a
  // coincidental weak match elsewhere doesn't trigger a false nudge.
  const crossSubjectMatch = (crossSubjectResult.data as { subject: string; similarity: number }[] | null)?.[0];
  const inSubjectTopSimilarity = textChunks[0]?.similarity ?? 0;
  const subjectWarning =
    crossSubjectMatch && crossSubjectMatch.similarity > inSubjectTopSimilarity + 0.15
      ? `This looks like it might be a ${crossSubjectMatch.subject} question — you're currently in your ${session.subject} chat. I've answered anyway, but for textbook-grounded help you may want to ask this in a ${crossSubjectMatch.subject} chat instead.`
      : null;

  // An empty `Ch? ""` placeholder reads to the model like a blank to fill in
  // (and it did, repeatedly, in testing) rather than "this data doesn't
  // exist" — so when chapter detection didn't tag a chunk, the tag omits the
  // chapter field entirely and says so in words instead of leaving a shape
  // that invites a guess.
  const chunkTag = (c: TextSource) =>
    c.chapter_num !== null && c.chapter_title
      ? `${c.book_title}, Ch${c.chapter_num} "${c.chapter_title}", Pg${c.page_num ?? '?'}`
      : `${c.book_title}, Pg${c.page_num ?? '?'} (chapter not identified for this passage — do not name or guess one)`;

  const contextText = textChunks.length
    ? textChunks.map((c) => `[${chunkTag(c)}]\n${c.content}`).join('\n\n---\n\n')
    : '(NONE — no textbook passages matched this question closely enough to be trustworthy.)';

  const imageContext = bookImages.length
    ? bookImages
        .map((i, idx) => `${idx + 1}. [Diagram: ${i.caption ?? 'untitled'} — ${i.chapter_title ?? ''}, Pg${i.page_num ?? '?'}]`)
        .join('\n')
    : 'NONE — no diagram from the textbook matched this question.';

  const answer = await chatCompletion(
    [
      {
        role: 'system',
        content: `You are a helpful NCERT tutor for Class ${session.class_num} ${session.subject} students in India.

FIRST, before anything else: check the conversation above. If this message is only asking you to redo your OWN last reply — shorter, simpler, in bullet points, in another tone, for a younger student, translated, etc. — with no new topic and no new fact needed, then just rewrite your last reply that way right now and stop reading further rules; none of the NCERT-grounding rules below apply to that case, because you're not making any new claim, only restating one you already made. Only move on to the numbered rules below if the student is asking about something that isn't already fully answered in your own previous reply above.

SECOND: figure out which of these two the message actually is, because they get opposite treatment:
  (a) A SOLVABLE PROBLEM — the student (in their text and/or an attached photo) has already given you every number, diagram, or fact you need to work something out yourself: a calculation, equation, number pattern/sequence, geometry question, logic puzzle, fill-in-the-blank. Here, solve it step by step using ordinary Class ${session.class_num} ${session.subject} reasoning, even if NCERT CONTEXT below is NONE or about something else — the grounding rules exist to stop you inventing NCERT-specific facts you were never given, not to stop you doing arithmetic or logic on a problem that's already fully specified. If a photo is attached, actually look at what it shows and solve that.
  (b) A LOOKUP — the student is asking you to recall, cite, or state something ABOUT the textbook itself: a page number, a chapter name or number, a table of contents, a section heading, "what does my book say/call this," or any other piece of the book's own structure or wording. Each passage below is individually tagged, either like [book, Ch3 "Acids and Bases", Pg12] when its chapter is known, or like [book, Pg12 (chapter not identified for this passage — do not name or guess one)] when it isn't. That tag is the ONLY source of truth for chapter/page citations; never state one that isn't literally shown in a tag.
      - A page number IS trustworthy to state, but ONLY the exact number shown in that passage's own tag — never a page number from your own estimate or general knowledge of similar books, and never a page adjacent to one you do have (if Pg12 is tagged, don't say "around page 12" or guess Pg13).
      - A chapter number or title is trustworthy ONLY when the tag actually names one, e.g. Ch3 "Acids and Bases". When a tag instead says chapter not identified, that IS the honest answer to give the student verbatim — you have the page number but genuinely do not have a chapter name or number for it. Do not substitute a "section title," a paraphrase, or any other invented label for the missing chapter name — that's the same fabrication with a different name attached to it. A hedge word ("usually," "probably") doesn't make an invented chapter name any less invented, and a student repeating your guessed "Chapter 10" to a teacher as fact is exactly the harm this rule exists to prevent.
If a message is both (e.g. "solve this AND tell me what page it's from"), apply each half separately: solve the problem freely, but for the citation half, state only the page/chapter that's actually tagged in the context, exactly as described above.

Ground rules, in order of importance:
1. Base your answer ONLY on the NCERT CONTEXT below when it's present. Do not add, correct, or "improve" facts using your own general knowledge if they conflict with or go beyond what the context says — the context is the textbook the student is being tested on, so it is the source of truth even if it differs from what you'd otherwise say. Never introduce a named example, substance, chemical formula, date, number, or other specific fact that is not literally written in the NCERT CONTEXT, even when it feels like the "obvious" or "textbook-standard" answer — your general knowledge is very often a different syllabus, a different example set, or a different level than this exact book, so a fact you're confident is true elsewhere may still be flat wrong to hand this student.
2. If NCERT CONTEXT is NONE, or doesn't actually cover what the student asked: say plainly that you don't have that specific content from their textbook right now, and suggest they ask about a specific chapter or topic, or check with their teacher. Do NOT invent chapter names, tables of contents, page contents, or any other structured facts about the book — a wrong confident answer is worse than an honest "I don't have that." This also applies when the context only PARTIALLY covers the question — e.g. it names the activity or lists raw samples/observations but never states the final grouping, result, or conclusion the student is asking about. In that case, quote/summarize only what the context actually says, then explicitly tell the student which part you cannot confirm from their book rather than completing the pattern yourself — do not silently fill the gap. Exception: this rule is about NEW factual claims. It does NOT apply when the student is instead asking you to reformat something YOU already said earlier in this same conversation — rephrase it, shorten it, simplify it for a younger student, translate it, turn it into bullet points, etc. That content was already grounded when you first wrote it; a fresh, unrelated NCERT CONTEXT below (or none at all) just means retrieval didn't need to run again for a request like that, not that your earlier answer stopped being valid. Reformat freely from the conversation above without adding any new facts beyond what you already said.
3. Never write image links, markdown image syntax (![...](...)), or placeholder/external image URLs yourself. You cannot attach images by writing them into your reply — the app attaches real textbook diagrams automatically, and ONLY the diagrams listed under RELEVANT DIAGRAMS IN TEXTBOOK below (if any) will actually be shown to the student. If a student asks to see an image and none are listed below, tell them honestly that no matching diagram was found for that specific question and ask them to describe the topic/figure a bit more (e.g. "the diagram in the acids and bases chapter") so it can be found — do not claim the app is incapable of showing images, since it can when one is actually retrieved.
4. Use LaTeX for equations ($...$ inline, $$...$$ block). Keep your tone encouraging and age-appropriate for a Class ${session.class_num} student.
5. When the NCERT CONTEXT names specific real examples, substances, numbers, or other concrete details relevant to the question, use those exact details in your answer instead of staying abstract or just restating the question back — a specific, grounded answer using the book's own named examples is far more useful to the student than a vague paraphrase, as long as every detail you use is actually present in the context.
6. The messages before this one are the recent conversation. Use them to resolve what "that," "the second one," or a short follow-up refers to, and (per the exception in rule 2) to reformat something you already said. But don't treat something said in an earlier turn as license to introduce a NEW fact that isn't in it: if the student's follow-up asks something beyond what was already established — a different sub-topic, a number or example that wasn't already given — that's a new factual claim, and it still has to come from today's NCERT CONTEXT per rule 1, not from guessing at what would fit the earlier answer.

NCERT CONTEXT:
${contextText}

RELEVANT DIAGRAMS IN TEXTBOOK:
${imageContext}`,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: text.trim() || 'Please explain the problem shown in this photo step by step.',
        ...(imageBase64 ? { images: [imageBase64] } : {}),
      },
    ],
    // A photo needs the multimodal model; text-only stays on the cheap chat tier.
    { tier: imageBase64 ? 'vision' : 'chat', usageContext },
  );

  const sources = textChunks.map((c) => ({
    bookTitle: c.book_title,
    chapter: c.chapter_title,
    page: c.page_num,
    excerpt: c.content.slice(0, 200),
  }));
  const returnedImages = bookImages.map((i) => ({ url: i.image_url, caption: i.caption, chapter: i.chapter_title, page: i.page_num }));

  await supabaseAdmin.from('chat_messages').insert({
    session_id: sessionId,
    role: 'assistant',
    content: answer,
    sources,
    returned_images: returnedImages,
    subject_warning: subjectWarning,
  });

  await supabaseAdmin.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);

  return { answer, sources, returnedImages, imageUrl, subjectWarning };
}
