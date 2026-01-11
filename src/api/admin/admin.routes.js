import express from 'express';
import admin from './adminController.js';
import { adminAuth } from '../../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación de admin
// router.use(adminAuth);

// Dashboard - Estadísticas generales
router.get('/dashboard', admin.estadisticas);

// Gestión de usuarios
router.get('/usuarios', admin.usuarios);
router.get('/usuarios/:id', admin.usuarios);
router.put('/usuarios/:id/estado', admin.actualizarEstadoUsuario);
router.delete('/usuarios/:id', admin.eliminarUsuario);

// Gestión de fotógrafos
router.get('/fotografos', admin.fotografos);

// Clasificaciones
router.get('/clasificaciones', admin.clases);
router.get('/datosUsuario/:id',admin.datosUsuario);
export default router;