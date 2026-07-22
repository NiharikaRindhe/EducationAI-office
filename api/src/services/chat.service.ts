import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { chatCompletion, embedText, aiConfigured } from '../lib/ai.js';
import type { CreateChatSessionInput } from '../schemas/chat.schema.js';

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
    .select('id, class_num, subject, created_at, updated_at')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list chat sessions', error.message);
  return data;
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

  const [textResult, imageResult] = await Promise.all([
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
      match_count: 3,
    }),
  ]);

  const textChunks = (textResult.data ?? []) as TextSource[];
  const bookImages = (imageResult.data ?? []) as ImageSource[];

  const contextText = textChunks.length
    ? textChunks
        .map((c) => `[${c.book_title}, Ch${c.chapter_num ?? '?'} "${c.chapter_title ?? ''}", Pg${c.page_num ?? '?'}]\n${c.content}`)
        .join('\n\n---\n\n')
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

Ground rules, in order of importance:
1. Base your answer ONLY on the NCERT CONTEXT below when it's present. Do not add, correct, or "improve" facts using your own general knowledge if they conflict with or go beyond what the context says — the context is the textbook the student is being tested on, so it is the source of truth even if it differs from what you'd otherwise say. Never introduce a named example, substance, chemical formula, date, number, or other specific fact that is not literally written in the NCERT CONTEXT, even when it feels like the "obvious" or "textbook-standard" answer — your general knowledge is very often a different syllabus, a different example set, or a different level than this exact book, so a fact you're confident is true elsewhere may still be flat wrong to hand this student.
2. If NCERT CONTEXT is NONE, or doesn't actually cover what the student asked: say plainly that you don't have that specific content from their textbook right now, and suggest they ask about a specific chapter or topic, or check with their teacher. Do NOT invent chapter names, tables of contents, page contents, or any other structured facts about the book — a wrong confident answer is worse than an honest "I don't have that." This also applies when the context only PARTIALLY covers the question — e.g. it names the activity or lists raw samples/observations but never states the final grouping, result, or conclusion the student is asking about. In that case, quote/summarize only what the context actually says, then explicitly tell the student which part you cannot confirm from their book rather than completing the pattern yourself — do not silently fill the gap.
3. Never write image links, markdown image syntax (![...](...)), or placeholder/external image URLs yourself. You cannot attach images by writing them into your reply — the app attaches real textbook diagrams automatically, and ONLY the diagrams listed under RELEVANT DIAGRAMS IN TEXTBOOK below (if any) will actually be shown to the student. If a student asks to see an image and none are listed below, tell them honestly that no matching diagram was found for that specific question and ask them to describe the topic/figure a bit more (e.g. "the diagram in the acids and bases chapter") so it can be found — do not claim the app is incapable of showing images, since it can when one is actually retrieved.
4. Use LaTeX for equations ($...$ inline, $$...$$ block). Keep your tone encouraging and age-appropriate for a Class ${session.class_num} student.
5. When the NCERT CONTEXT names specific real examples, substances, numbers, or other concrete details relevant to the question, use those exact details in your answer instead of staying abstract or just restating the question back — a specific, grounded answer using the book's own named examples is far more useful to the student than a vague paraphrase, as long as every detail you use is actually present in the context.

NCERT CONTEXT:
${contextText}

RELEVANT DIAGRAMS IN TEXTBOOK:
${imageContext}`,
      },
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
  });

  await supabaseAdmin.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);

  return { answer, sources, returnedImages, imageUrl };
}
