/**
 * router.js — Módulo de pagos y membresías
 *
 * Prefijo en routes/index.js: /api/pagos
 *
 * Rutas disponibles:
 *  POST /api/pagos/estadoMembresia      → estado de membresía del usuario
 *  POST /api/pagos/membresias           → catálogo de membresías disponibles
 *  POST /api/pagos/iniciarPago          → iniciar proceso de pago con Wompi
 *  POST /api/pagos/webhookWompi         → webhook de eventos de Wompi (sin JWT)
 *  POST /api/pagos/historial            → historial de suscripciones del usuario
 *  POST /api/pagos/cancelarSuscripcion  → cancelar suscripción activa
 *  POST /api/pagos/verificarTransaccion → consultar transacción en Wompi
 */

import express from 'express';
import pagosController from './controllers/pagos.controller.js';

const router = express.Router();

// Estado de membresía y créditos — uso principal al login / inicio de sesión
router.post('/estadoMembresia', pagosController.estadoMembresia);

// Catálogo de membresías disponibles para comprar
router.post('/membresias', pagosController.getMembresias);

// Iniciar proceso de pago (genera referencia + datos para widget Wompi)
router.post('/iniciarPago', pagosController.iniciarPago);

// Webhook de Wompi — NO proteger con JWT, Wompi llama este endpoint directamente
router.post('/webhookWompi', pagosController.webhookWompi);

// Historial completo de suscripciones del usuario
router.post('/historial', pagosController.historialSuscripciones);

// Cancelar suscripción manualmente
router.post('/cancelarSuscripcion', pagosController.cancelarSuscripcion);

// Verificar estado de transacción directamente en Wompi
router.post('/verificarTransaccion', pagosController.verificarTransaccion);

export default router;
