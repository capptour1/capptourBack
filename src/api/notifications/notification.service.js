/**
 * notification.service.js
 *
 * Servicio central de notificaciones.
 * Persiste en BD y emite el evento socket al usuario destinatario en tiempo real.
 *
 * Uso desde cualquier parte del backend:
 *   import notificationService from '../notifications/notification.service.js';
 *   await notificationService.send({ userId, tipo, titulo, mensaje, action, payload });
 *
 * El campo `action` indica al frontend qué pantalla abrir:
 *   OPEN_BOOKING, OPEN_CHAT, OPEN_SESSION, OPEN_PAYMENT, NONE, etc.
 */

import notificationDao from './dao/notification.dao.js';
import { getIo } from '../../sockets/index.js';

// ─── Mapeo tipo → acción por defecto ─────────────────────────────────────────

const DEFAULT_ACTIONS = {
  booking: 'OPEN_BOOKING',
  session: 'OPEN_SESSION',
  message: 'OPEN_CHAT',
  rating: 'NONE',
  payment: 'OPEN_PAYMENT',
  system: 'NONE',
  promo: 'OPEN_URL',
};

/**
 * Crea y envía una notificación.
 *
 * @param {object} opts
 * @param {number}  opts.userId   - destinatario
 * @param {string}  opts.tipo     - 'message' | 'session' | 'booking' | 'rating' | 'system' | 'promo'
 * @param {string}  opts.titulo
 * @param {string}  opts.mensaje
 * @param {string}  [opts.action] - acción para el frontend (si no se pasa, se deduce del tipo)
 * @param {object}  [opts.payload] - datos extra para navegación en el cliente
 * @param {object}  [opts.transaction] - transacción de Sequelize (opcional)
 */
const send = async (io_or_opts, opts_or_undefined) => {
  // Mantener retrocompatibilidad con la firma anterior: send(io, { ... })
  let opts;
  if (opts_or_undefined !== undefined) {
    // Firma legacy: send(io, { userId, ... })
    opts = opts_or_undefined;
  } else {
    // Firma nueva: send({ userId, ... })
    opts = io_or_opts;
  }

  const { userId, tipo, titulo, mensaje, action, payload = null, transaction } = opts;

  // Resolver acción
  const resolvedAction = action || DEFAULT_ACTIONS[tipo] || 'NONE';

  // 1. Persistir en BD
  const notif = await notificationDao.create({
    userId,
    tipo,
    titulo,
    mensaje,
    payload: payload ? { ...payload, action: resolvedAction } : { action: resolvedAction },
    transaction,
  });

  // 2. Emitir en tiempo real si el usuario está conectado
  const io = getIo();
  if (io) {
    io.to(`user_${userId}`).emit('notification:new', {
      id: notif.id,
      tipo: notif.tipo,
      titulo: notif.titulo,
      mensaje: notif.mensaje,
      action: resolvedAction,
      payload: notif.payload,
      leida: false,
      fec_creacion: notif.fec_creacion,
    });
  }

  return notif;
};

export default { send };
