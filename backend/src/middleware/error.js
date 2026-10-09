import { ApiError } from '../utils/ApiError.js';
import { isProd } from '../config/env.js';
import { logger } from '../config/logger.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, _next) {
  let error = err;

  // Normalise the errors mongoose and friends throw into ApiError.
  if (!(error instanceof ApiError)) {
    if (err?.name === 'ValidationError') {
      error = ApiError.badRequest('Some fields need fixing', {
        details: Object.values(err.errors ?? {}).map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    } else if (err?.name === 'CastError') {
      error = ApiError.badRequest(`"${err.value}" is not a valid ${err.path}`);
    } else if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern ?? {})[0] ?? 'value';
      error = ApiError.conflict(`That ${field} is already taken`);
    } else if (err?.type === 'entity.too.large') {
      error = new ApiError(413, 'That payload is too large');
    } else if (err?.name === 'MulterError') {
      error = ApiError.badRequest(
        err.code === 'LIMIT_FILE_SIZE' ? 'That file is too large' : 'Upload failed'
      );
    } else {
      error = ApiError.internal(isProd ? 'Something went wrong' : String(err?.message ?? err));
    }
  }

  if (error.status >= 500) {
    logger.error({ err, path: req.originalUrl }, 'request failed');
  } else {
    logger.debug({ status: error.status, path: req.originalUrl, msg: error.message }, 'request rejected');
  }

  res.status(error.status).json({
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
    ...(isProd || error.status < 500 ? {} : { stack: err?.stack }),
  });
}
