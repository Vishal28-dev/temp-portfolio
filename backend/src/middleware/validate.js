import { ApiError } from '../utils/ApiError.js';

/**
 * validate({ body, query, params }) — each value is a zod schema.
 * Parsed output replaces req.body / req.params, and is exposed as
 * req.valid.query (req.query itself is read-only in Express 5).
 */
export const validate = (schemas) => (req, _res, next) => {
  req.valid = req.valid ?? {};

  for (const key of ['body', 'query', 'params']) {
    const schema = schemas[key];
    if (!schema) continue;

    const result = schema.safeParse(req[key]);
    if (!result.success) {
      return next(
        ApiError.badRequest('Some fields need fixing', {
          details: result.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        })
      );
    }

    req.valid[key] = result.data;
    if (key !== 'query') req[key] = result.data;
  }

  return next();
};
