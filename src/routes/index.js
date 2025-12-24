import express from 'express';
import authRoutes from '../api/auth/router.js';
import userRoutes from '../api/users/router.js';
import photographerRoutes from '../api/photographers/router.js';
import chatRoutes from '../api/chat/routes.js';


const router = express.Router();


//
router.use('/auth', authRoutes);
router.use('/photographer', photographerRoutes);
router.use('/user', userRoutes);
router.use('/chat', chatRoutes);

export default router;