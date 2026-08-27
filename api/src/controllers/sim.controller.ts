import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/errors.js';
import { requireId } from '../lib/httpParams.js';
import { logger } from '../lib/logger.js';
import { parsePageImage } from '../lib/simPageImage.js';
import { SimSpecSchema, resolveSimBrief } from '../lib/simShared/index.js';
import {
  simChatSchema,
  simExplainSchema,
  simExplainSelectionSchema,
  simGenerateSchema,
  simBriefSchema,
  createSimNoteSchema,
  updateSimNoteSchema,
} from '../schemas/sim.schema.js';
import * as simAccess from '../services/simAccess.service.js';
import * as simNotes from '../services/simNotes.service.js';
import { generateCustomSimulation } from '../services/simClassify.service.js';
import { validateMathExpressions } from '../services/simIngest.service.js';
import {
  generateStudentExplanation,
  generateSelectionExplanation,
  generateChatReplyStream,
  ensureSimBrief,
  type ChatStreamEvent,
} from '../services/simExplain.service.js';
import { topicsFromSpecs } from '../services/simSyllabusGuard.service.js';

function usageContextOf(req: Request) {
  return { schoolId: req.user!.schoolId, userId: req.user!.id };
}

function studentOf(req: Request) {
  return { id: req.user!.id, schoolId: req.user!.schoolId };
}

/** 400s on a present-but-malformed image; a genuinely absent image is fine. */
function validatedImage(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (!parsePageImage(raw)) throw new ApiError('VALIDATION_ERROR', 'image must be a JPEG or PNG data URL under 800KB');
  return raw;
}

export async function listBooksController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ books: await simAccess.listReadableBooks(studentOf(req)) });
  } catch (err) {
    next(err);
  }
}

export async function getPdfUrlController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await simAccess.getSignedPdfUrl(requireId(req, 'jobId'), studentOf(req)));
  } catch (err) {
    next(err);
  }
}

export async function getAnnotationsController(req: Request, res: Response, next: NextFunction) {
  try {
    const jobId = requireId(req, 'jobId');
    const rawPage = req.query.page;
    const page = typeof rawPage === 'string' && rawPage.trim() ? Number(rawPage) : undefined;
    if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
      throw new ApiError('VALIDATION_ERROR', 'page must be a positive integer');
    }
    const annotations = await simAccess.getAnnotations(jobId, studentOf(req), page);
    res.json({ jobId, pageNumber: page ?? null, count: annotations.length, annotations });
  } catch (err) {
    next(err);
  }
}

/** Streams the chat tutor's reply over SSE as it's generated. SSE-always —
 *  the reader (src/routes/shared/reader/api.ts) is the only consumer, so
 *  there's no dual JSON-or-SSE mode to maintain (a plain-JSON fallback can
 *  be added later in a few lines if some other client ever needs one,
 *  since generateChatReplyStream()'s `emit` sink is transport-agnostic).
 *
 *  IMPORTANT: once res.flushHeaders() below has run, this function must
 *  never call next(err) — errorHandler.ts calls res.status().json()
 *  unconditionally with no headersSent check, which would crash with
 *  ERR_HTTP_HEADERS_SENT on a response that's already streaming. The
 *  `streaming` flag marks that boundary; past it, failures are written
 *  as an SSE {type:'error'} frame and the stream is closed directly. */
export async function chatController(req: Request, res: Response, next: NextFunction) {
  let streaming = false;
  try {
    const input = simChatSchema.parse(req.body);
    const student = studentOf(req);
    const book = await simAccess.requireReadableBook(input.jobId, student);
    const pageText = await simAccess.getPageText(input.jobId, student, input.page);
    const topics = await simAccess.listBookTopics(input.jobId, student);
    const image = validatedImage(input.image);

    // Everything above can still safely reach errorHandler via next(err) —
    // no response headers have been written yet.
    streaming = true;
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // nginx: don't buffer this response
    res.flushHeaders();

    const write = (event: ChatStreamEvent) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // Cancels the in-flight AI call if the student navigates away —
    // stops spending tokens on a response nobody will read.
    const abortController = new AbortController();
    res.on('close', () => abortController.abort());

    try {
      await generateChatReplyStream(
        input.messages,
        {
          title: book.bookTitle,
          currentPage: input.page,
          parentTopic: input.parentTopic,
          domain: input.domain,
          pageText,
          pageImage: image,
          syllabusTopics: topicsFromSpecs(topics),
          bookId: input.jobId,
        },
        write,
        usageContextOf(req),
        abortController.signal,
      );
    } catch (err) {
      logger.error({ err }, '[sim.controller] chat stream failed');
      write({ type: 'error', error: err instanceof Error ? err.message : 'Failed to generate chat reply' });
    }
    if (!res.writableEnded) res.end();
  } catch (err) {
    if (streaming) {
      logger.error({ err }, '[sim.controller] chat controller error after stream start');
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to generate chat reply' })}\n\n`);
        res.end();
      }
      return;
    }
    next(err);
  }
}

export async function explainController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = simExplainSchema.parse(req.body);
    const student = studentOf(req);
    const annotation = await simAccess.getAnnotationById(input.jobId, input.annotationId, student);
    const pageText = await simAccess.getPageText(input.jobId, student, annotation.pageNumber);

    const explanation = await generateStudentExplanation(
      { spec: annotation.spec, quote: annotation.quote, pageText, mode: input.mode, customQuestion: input.customQuestion },
      usageContextOf(req),
    );
    res.json({ success: true, explanation });
  } catch (err) {
    next(err);
  }
}

export async function explainSelectionController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = simExplainSelectionSchema.parse(req.body);
    const student = studentOf(req);
    await simAccess.requireReadableBook(input.jobId, student);
    const pageText = await simAccess.getPageText(input.jobId, student, input.page);
    const image = validatedImage(input.image);

    const explanation = await generateSelectionExplanation(
      {
        selectedText: input.selectedText,
        pageText,
        currentPage: input.page,
        parentTopic: input.parentTopic,
        domain: input.domain,
        mode: input.mode,
        pageImage: image,
      },
      usageContextOf(req),
    );
    res.json({ success: true, explanation });
  } catch (err) {
    next(err);
  }
}

export async function generateController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = simGenerateSchema.parse(req.body);
    const student = studentOf(req);
    const book = await simAccess.requireReadableBook(input.jobId, student);
    const pageText = await simAccess.getPageText(input.jobId, student, input.page);

    const candidate = await generateCustomSimulation(
      input.prompt,
      { classNum: book.classNum, usageContext: usageContextOf(req) },
      { quote: pageText.slice(0, 200) },
    );

    const playable = Boolean((candidate.templateId && candidate.isSimulatable) || (candidate.stage && candidate.stage.elements.length > 0));
    if (!candidate.isSimulatable || !playable) {
      throw new ApiError('AI_BAD_OUTPUT', 'Could not generate a valid animated simulation for this prompt — try a more specific concept.');
    }
    if (!validateMathExpressions(candidate)) {
      throw new ApiError('AI_BAD_OUTPUT', 'Generated simulation contained invalid mathematical syntax.');
    }

    const { importance: _importance, ...simSpec } = candidate;
    void _importance;
    const specWithBrief = await ensureSimBrief(simSpec, simSpec.quote || input.prompt.slice(0, 200), usageContextOf(req));

    let savedAnnotation = null;
    if (input.annotationId) {
      savedAnnotation = await simAccess.updateAnnotationSpec(input.jobId, input.annotationId, student, specWithBrief, specWithBrief.quote || input.prompt.slice(0, 200));
    }

    res.json({ success: true, spec: specWithBrief, annotation: savedAnnotation, isCustom: !input.annotationId });
  } catch (err) {
    next(err);
  }
}

/** Never calls an LLM — reads the brief already embedded in the spec, or
 *  derives one procedurally. The client echoes back a spec it already
 *  legitimately holds (from getAnnotations or /generate); this is a pure
 *  transform with no DB write and no AI spend, so that's an acceptable
 *  trust boundary unlike the grounding-text endpoints above. */
export async function simBriefController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = simBriefSchema.parse(req.body);
    const spec = SimSpecSchema.parse(input.spec);
    res.json({ success: true, brief: resolveSimBrief(spec, input.quote) });
  } catch (err) {
    next(err);
  }
}

export async function listNotesController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ notes: await simNotes.listSimNotes(requireId(req, 'jobId'), studentOf(req)) });
  } catch (err) {
    next(err);
  }
}

export async function createNoteController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createSimNoteSchema.parse(req.body);
    res.status(201).json({ note: await simNotes.createSimNote(studentOf(req), input) });
  } catch (err) {
    next(err);
  }
}

export async function updateNoteController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateSimNoteSchema.parse(req.body);
    res.json({ note: await simNotes.updateSimNote(requireId(req, 'noteId'), studentOf(req), input) });
  } catch (err) {
    next(err);
  }
}

export async function deleteNoteController(req: Request, res: Response, next: NextFunction) {
  try {
    await simNotes.deleteSimNote(requireId(req, 'noteId'), studentOf(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
