import { Router } from 'express';
import publicRoutes from './v1/public.routes.js';
import authRoutes from './v1/auth.routes.js';
import adminRoutes from './v1/admin.routes.js';

const router = Router();

router.use('/', publicRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

export default router;
