import express from 'express';
import rolesRoutes from '../api/roles.js';
import usersRoutes from '../api/users.js';
import authRoutes from '../api/auth/login.js';
import photosRoutes from '../api/photos.js';
import photographerRoutes from '../api/auth/photographer.js';
import ubicacionRoutes from '../api/auth/ubicacion.js';
import bookingsRoutes from '../api/bookings.js';
import reservasRoutes from '../api/reservas.js';
import photosUsersRoutes from '../api/users/photos.js';
import sesionFotosRoutes from '../api/sesion_fotos.js';
import chatRoutes from '../api/chat/chat.routes.js';
import adminRoutes from '../api/admin/admin.routes.js';
import pagosRoutes from '../api/photographers/pagos.js';
import immediateUploadRouter from '../api/photos/immediate/upload.js';
import immediateRouter from '../api/photos/immediate/immediate.js';
import qrRoutes from '../api/photographers/qr.js';
import usuarioRoutes from '../api/usuario/usuario.js';

const router = express.Router();

router.use('/roles', rolesRoutes);
router.use('/users', usersRoutes);
router.use('/auth', authRoutes);
router.use('/photos', photosRoutes);
router.use('/photographer', photographerRoutes);
router.use('/ubicacion', ubicacionRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/reservas', reservasRoutes);
router.use('/users/photos', photosUsersRoutes);
router.use('/sesion_fotos', sesionFotosRoutes);
router.use('/chat', chatRoutes);
router.use('/admin', adminRoutes);
router.use('/pagos', pagosRoutes);
router.use('/usuario', usuarioRoutes);

// ✅ RUTAS CORREGIDAS (sin duplicados)
router.use('/photos/immediate/upload', immediateUploadRouter);
router.use('/photos/immediate', immediateRouter); // ← Quitar el "/immediate" duplicado

router.use('/photographers/qr', qrRoutes);

export default router;