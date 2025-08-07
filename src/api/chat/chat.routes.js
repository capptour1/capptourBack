// src/api/chat/chat.routes.js
import express from 'express';
import { enviarMensaje, obtenerHistorial, obtenerUsuarioPorId, obtenerUsuariosConConversacion } from './chatController.js';

const router = express.Router();

router.post('/enviar', enviarMensaje);
router.get('/historial', obtenerHistorial);
router.get('/usuario/:id', obtenerUsuarioPorId);
router.get('/usuarios_con_conversacion', obtenerUsuariosConConversacion);

export default router;
