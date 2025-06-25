import express from 'express';
import rolesRoutes from '../api/roles.js';
import usersRoutes from '../api/users.js';
import authRoutes from '../api/auth/login.js';

const router = express.Router();

router.use('/roles', rolesRoutes);
router.use('/users', usersRoutes);
router.use('/auth', authRoutes);

export default router;
