import express from 'express';
import authRoutes from '../api/auth/router.js';
import userRoutes from '../api/users/router.js';
import photographerRoutes from '../api/photographers/router.js';
import chatRoutes from '../api/chat/routes.js';
import notificationRoutes from '../api/notifications/router.js';
import pagosRoutes from '../api/membresias/router.js';
import sharedRoutes from '../api/shared/router.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/photographer', photographerRoutes);
router.use('/user', userRoutes);
router.use('/chat', chatRoutes);
router.use('/shared', sharedRoutes);
router.use('/notifications', notificationRoutes);
router.use('/pagos', pagosRoutes);

export default router;