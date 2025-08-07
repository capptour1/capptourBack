// src/api/chat/chat.routes.js
import express from 'express';
import { enviarMensaje, obtenerHistorial } from './chatController.js';

const router = express.Router();

router.post('/enviar', enviarMensaje);
router.post('/historial', obtenerHistorial);

export default router;
