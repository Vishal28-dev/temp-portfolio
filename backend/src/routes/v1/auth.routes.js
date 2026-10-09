import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginBody } from '../../validators/schemas.js';
import * as auth from '../../controllers/auth.controller.js';

const router = Router();

router.post('/login', authLimiter, validate({ body: loginBody }), auth.login);
router.post('/refresh', authLimiter, auth.refresh);
router.post('/logout', requireAuth, auth.logout);
router.get('/me', requireAuth, auth.me);

export default router;
