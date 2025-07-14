import express from 'express';
import rolesRoutes from '../api/roles.js';
import usersRoutes from '../api/users.js';
import authRoutes from '../api/auth/login.js';
import photosRoutes from '../api/photos.js';
import photographerRoutes from '../api/auth/photographer.js';
import ubicacionRoutes from '../api/auth/ubicacion.js';

const router = express.Router();

router.use('/roles', rolesRoutes);
router.use('/users', usersRoutes);
router.use('/auth', authRoutes);
router.use('/photos', photosRoutes);
router.use('/photographer', photographerRoutes);
router.use('/ubicacion', ubicacionRoutes);

export default router;
