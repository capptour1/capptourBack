import express from 'express';
import authRoutes from '../api/auth/router.js';
import userRoutes from '../api/users/router.js';
import photographerRoutes from '../api/photographers/router.js';
import chatRoutes from '../api/chat/routes.js';
import adminRoutes from '../api/admin/admin.routes.js';

const router = express.Router();

// Rutas públicas
router.use('/auth', authRoutes);

// Rutas protegidas
router.use('/photographer', photographerRoutes);
router.use('/user', userRoutes);
router.use('/chat', chatRoutes);

// Rutas de administración (requieren permisos de admin)
router.use('/admin', adminRoutes);

export default router;