export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SCHOOL_INVALID'
  | 'VALIDATION_ERROR'
  | 'SUBJECT_NOT_WHITELISTED'
  | 'AI_RATE_LIMIT'
  | 'RATE_LIMITED'
  | 'EXAM_NOT_OPEN'
  | 'EXAM_CLOSED'
  | 'EXAM_ALREADY_SUBMITTED'
  | 'CSV_IMPORT_ERROR'
  | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SCHOOL_INVALID: 400,
  VALIDATION_ERROR: 422,
  SUBJECT_NOT_WHITELISTED: 422,
  AI_RATE_LIMIT: 429,
  RATE_LIMITED: 429,
  EXAM_NOT_OPEN: 400,
  EXAM_CLOSED: 400,
  EXAM_ALREADY_SUBMITTED: 400,
  CSV_IMPORT_ERROR: 422,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}
