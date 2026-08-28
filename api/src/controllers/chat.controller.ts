import type { Request, Response, NextFunction } from 'express';
import { createChatSessionSchema, renameChatSessionSchema, sendMessageSchema } from '../schemas/chat.schema.js';
import * as chatService from '../services/chat.service.js';
import { requireId } from '../lib/httpParams.js';

export async function listMySubjectsController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await chatService.listMySubjects(req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function createSessionController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createChatSessionSchema.parse(req.body);
    res.status(201).json(await chatService.createSession(req.user!.id, input));
  } catch (err) {
    next(err);
  }
}

export async function listSessionsController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await chatService.listSessions(req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function getHistoryController(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await chatService.getHistory(req.user!.id, requireId(req)));
  } catch (err) {
    next(err);
  }
}

/** Streams the tutor's reply over SSE as it's generated (see
 *  chat.service.ts's sendMessage) instead of making the student wait for
 *  the whole retrieval-plus-completion round trip behind a spinner. SSE
 *  headers are only sent once the first token actually arrives, so an
 *  early failure (session not found, AI slot unavailable, etc.) still
 *  reaches the client as a normal JSON error response via `next(err)`. */
export async function sendMessageController(req: Request, res: Response, next: NextFunction) {
  let streaming = false;
  try {
    const { text, imageBase64 } = sendMessageSchema.parse(req.body);

    const result = await chatService.sendMessage(req.user!.id, requireId(req), text, imageBase64, (delta) => {
      if (!streaming) {
        streaming = true;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
      }
      res.write(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`);
    });

    res.write(`data: ${JSON.stringify({
      type: 'done',
      sources: result.sources,
      returnedImages: result.returnedImages,
      imageUrl: result.imageUrl,
      subjectWarning: result.subjectWarning ?? null,
    })}\n\n`);
    res.end();
  } catch (err) {
    if (streaming) {
      // Already streamed at least one token — the client is mid-render of a
      // real answer, so surface the failure as a final SSE frame rather than
      // attempting a second, invalid response.
      res.write(`data: ${JSON.stringify({ type: 'error', error: err instanceof Error ? err.message : 'Failed to generate a reply' })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
}

export async function renameSessionController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = renameChatSessionSchema.parse(req.body);
    res.json(await chatService.renameSession(req.user!.id, requireId(req), input));
  } catch (err) {
    next(err);
  }
}

export async function deleteSessionController(req: Request, res: Response, next: NextFunction) {
  try {
    await chatService.deleteSession(req.user!.id, requireId(req));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
