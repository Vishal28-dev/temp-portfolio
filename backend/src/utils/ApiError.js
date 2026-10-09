export class ApiError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code ?? httpCode(status);
    if (details) this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(m = 'Bad request', o) { return new ApiError(400, m, o); }
  static unauthorized(m = 'Not signed in', o) { return new ApiError(401, m, o); }
  static forbidden(m = 'Not allowed', o) { return new ApiError(403, m, o); }
  static notFound(m = 'Not found', o) { return new ApiError(404, m, o); }
  static conflict(m = 'Already exists', o) { return new ApiError(409, m, o); }
  static tooMany(m = 'Too many requests', o) { return new ApiError(429, m, o); }
  static internal(m = 'Something went wrong', o) { return new ApiError(500, m, o); }
}

function httpCode(status) {
  return {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'RATE_LIMITED',
    500: 'INTERNAL',
  }[status] ?? 'ERROR';
}
