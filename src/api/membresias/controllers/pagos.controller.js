/**
 * pagos.controller.js
 *
 * Controller dedicado a toda la lógica de pagos y membresías.
 * Delega la lógica de negocio a membresias.service.js.
 *
 * Endpoints expuestos:
 *  POST /pagos/estadoMembresia      → estado de membresía del usuario autenticado
 *  POST /pagos/membresias           → listado de membresías disponibles
 *  POST /pagos/iniciarPago          → iniciar proceso de pago con Wompi
 *  POST /pagos/webhookWompi         → webhook que recibe Wompi (sin auth JWT)
 *  POST /pagos/historial            → historial de suscripciones del usuario
 *  POST /pagos/cancelarSuscripcion  → cancelar suscripción activa
 *  POST /pagos/verificarTransaccion → verificar estado de transacción en Wompi
 */

import membresiaService from '../services/membresias.service.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;

// ─── Estado de membresía y créditos ───────────────────────────────────────────

/**
 * POST /pagos/estadoMembresia
 * Body: { usuario_id }
 *
 * Retorna el estado completo de la membresía del usuario:
 * si tiene suscripción, si está vigente, créditos disponibles, etc.
 * Es el endpoint principal que debe llamarse al login y al iniciar la app.
 */
const estadoMembresia = async (req, res) => {
  try {
    const { usuario_id } = req.body;

    if (!usuario_id) {
      throw new AppError('usuario_id es requerido', 400);
    }

    const estado = await membresiaService.get_estado_membresia(Number(usuario_id));
    return successResponse(res, estado, 'Estado de membresía obtenido correctamente');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// ─── Listado de membresías disponibles ────────────────────────────────────────

/**
 * POST /pagos/membresias
 * Body: {} (sin parámetros)
 *
 * Retorna el catálogo de membresías disponibles para comprar.
 */
const getMembresias = async (req, res) => {
  try {
    const membresias = await membresiaService.get_membresias_disponibles();
    return successResponse(res, membresias, 'Membresías obtenidas correctamente');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// ─── Iniciar pago ─────────────────────────────────────────────────────────────

/**
 * POST /pagos/iniciarPago
 * Body: { usuario_id, membresia_id }
 *
 * Genera la referencia única, crea la transacción en estado PENDING
 * y retorna los datos necesarios para el widget de Wompi en el frontend.
 */
const iniciarPago = async (req, res) => {
  try {
    const { usuario_id, membresia_id } = req.body;

    if (!usuario_id || !membresia_id) {
      throw new AppError('usuario_id y membresia_id son requeridos', 400);
    }

    const resultado = await membresiaService.iniciar_pago(
      Number(usuario_id),
      Number(membresia_id)
    );
    return successResponse(res, resultado, 'Pago iniciado correctamente');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// ─── Webhook de Wompi ─────────────────────────────────────────────────────────

/**
 * POST /pagos/webhookWompi
 * Body: payload de Wompi (ver documentación Wompi)
 *
 * Este endpoint NO debe protegerse con JWT — Wompi lo llama directamente.
 * La seguridad se valida mediante la firma/checksum del payload de Wompi.
 *
 * IMPORTANTE: Registrar esta URL en el panel de Wompi como URL de eventos.
 * Wompi enviará eventos como: transaction.updated
 */
const webhookWompi = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload) {
      throw new AppError('Payload vacío', 400);
    }

    const resultado = await membresiaService.procesar_webhook_wompi(payload);

    // Wompi espera respuesta 200 para confirmar recepción
    return successResponse(res, resultado, 'Webhook procesado');
  } catch (error) {
    console.error('[WOMPI WEBHOOK ERROR]', error);
    return errorResponse(res, error);
  }
};

// ─── Historial de suscripciones ────────────────────────────────────────────────

/**
 * POST /pagos/historial
 * Body: { usuario_id }
 *
 * Retorna el historial completo de suscripciones del usuario.
 */
const historialSuscripciones = async (req, res) => {
  try {
    const { usuario_id } = req.body;

    if (!usuario_id) {
      throw new AppError('usuario_id es requerido', 400);
    }

    const historial = await membresiaService.get_historial_suscripciones(Number(usuario_id));
    return successResponse(res, historial, 'Historial obtenido correctamente');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// ─── Cancelar suscripción ─────────────────────────────────────────────────────

/**
 * POST /pagos/cancelarSuscripcion
 * Body: { suscripcion_id, usuario_id }
 *
 * Cancela la suscripción indicada si pertenece al usuario.
 */
const cancelarSuscripcion = async (req, res) => {
  try {
    const { suscripcion_id, usuario_id } = req.body;

    if (!suscripcion_id || !usuario_id) {
      throw new AppError('suscripcion_id y usuario_id son requeridos', 400);
    }

    const resultado = await membresiaService.cancelar_suscripcion(
      Number(suscripcion_id),
      Number(usuario_id)
    );
    return successResponse(res, resultado, 'Suscripción cancelada correctamente');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// ─── Verificar transacción en Wompi ──────────────────────────────────────────

/**
 * POST /pagos/verificarTransaccion
 * Body: { wompi_transaccion_id }
 *
 * Consulta el estado actual de una transacción directamente en la API de Wompi.
 * Útil para casos donde el webhook no llegó o como verificación manual.
 */
const verificarTransaccion = async (req, res) => {
  try {
    const { wompi_transaccion_id } = req.body;

    if (!wompi_transaccion_id) {
      throw new AppError('wompi_transaccion_id es requerido', 400);
    }

    const resultado = await membresiaService.consultar_transaccion_wompi(wompi_transaccion_id);
    return successResponse(res, resultado, 'Transacción consultada correctamente');
  } catch (error) {
    return errorResponse(res, error);
  }
};

export default {
  estadoMembresia,
  getMembresias,
  iniciarPago,
  webhookWompi,
  historialSuscripciones,
  cancelarSuscripcion,
  verificarTransaccion,
};
