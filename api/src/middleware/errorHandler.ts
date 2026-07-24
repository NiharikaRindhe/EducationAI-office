import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const MULTER_ERROR_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: 'That file is too large for the configured upload limit.',
  LIMIT_FILE_COUNT: 'Too many files in one upload.',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field in the upload.',
};

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, status: err.status, details: err.details },
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request failed validation',
        status: 422,
        details: err.flatten(),
      },
    });
  }

  // Busboy/Multer throw a plain MulterError for oversized/malformed uploads —
  // without this it fell through to the generic 500 below, which is exactly
  // what turned a routine "your file is too big" into an opaque "Something
  // went wrong" in the upload UI.
  if (err instanceof MulterError) {
    return res.status(400).json({
      error: {
        code: err.code,
        message: MULTER_ERROR_MESSAGES[err.code] ?? err.message,
        status: 400,
      },
    });
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong', status: 500 },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `No route: ${req.method} ${req.path}`, status: 404 },
  });
}
