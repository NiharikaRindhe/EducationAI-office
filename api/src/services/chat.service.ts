import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { chatCompletion, embedText, ollamaConfigured } from '../lib/ollama.js';
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

export async function sendMessage(studentId: string, sessionId: string, text: string) {
  const { data: session } = await supabaseAdmin
    .from('chat_sessions')
    .select('id, class_num, subject')
    .eq('id', sessionId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (!session) throw new ApiError('NOT_FOUND', 'Chat session not found');

  await supabaseAdmin.from('chat_messages').insert({ session_id: sessionId, role: 'user', content: text });

  if (!(await ollamaConfigured())) {
    const fallback =
      "I can't reach the AI tutor right now — please try again in a moment, or ask your teacher for help.";
    await supabaseAdmin.from('chat_messages').insert({ session_id: sessionId, role: 'assistant', content: fallback });
    return { answer: fallback, sources: [], returnedImages: [] };
  }

  const queryEmbedding = await embedText(text);

  const [textResult, imageResult] = await Promise.all([
    supabaseAdmin.rpc('search_text_chunks', {
      query_embedding: queryEmbedding,
      match_class: session.class_num,
      match_subject: session.subject,
      match_count: 5,
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
    : '(No matching NCERT content found in the database yet for this class/subject — answer from general knowledge and say so.)';

  const imageContext = bookImages.length
    ? bookImages.map((i) => `[Diagram: ${i.caption ?? 'untitled'} — ${i.chapter_title ?? ''}, Pg${i.page_num ?? '?'}]`).join('\n')
    : 'None found.';

  const answer = await chatCompletion([
    {
      role: 'system',
      content: `You are a helpful NCERT tutor for Class ${session.class_num} ${session.subject} students in India. Answer using the provided NCERT context where possible. Use LaTeX for equations ($...$ inline, $$...$$ block). Keep your tone encouraging and age-appropriate. If context doesn't cover the question, say so honestly rather than guessing.\n\nNCERT CONTEXT:\n${contextText}\n\nRELEVANT DIAGRAMS IN TEXTBOOK:\n${imageContext}`,
    },
    { role: 'user', content: text },
  ]);

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

  return { answer, sources, returnedImages };
}
