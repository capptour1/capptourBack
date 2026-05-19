/**
 * notification.service.js
 *
 * Servicio central de notificaciones.
 * Persiste en BD y emite el evento socket al usuario destinatario en tiempo real.
 *
 * Uso desde cualquier parte del backend:
 *   import notificationService from '../notifications/notification.service.js';
 *   await notificationService.send(io, { userId, tipo, titulo, mensaje, payload });
 */

import notificationDao from './dao/notification.dao.js';

/**
 * Crea y envía una notificación.
 *
 * @param {import('socket.io').Server} io  - instancia global de Socket.IO
 * @param {object} opts
 * @param {number}  opts.userId   - destinatario
 * @param {string}  opts.tipo     - 'message' | 'session' | 'booking' | 'rating' | 'system' | 'promo'
 * @param {string}  opts.titulo
 * @param {string}  opts.mensaje
 * @param {object}  [opts.payload] - datos extra para navegación en el cliente
 */
const send = async (io, { userId, tipo, titulo, mensaje, payload = null }) => {
  // 1. Persistir en BD
  const notif = await notificationDao.create({ userId, tipo, titulo, mensaje, payload });

  // 2. Emitir en tiempo real si el usuario está conectado
  if (io) {
    io.to(`user_${userId}`).emit('notification:new', {
      id: notif.id,
      tipo: notif.tipo,
      titulo: notif.titulo,
      mensaje: notif.mensaje,
      payload: notif.payload,
      leida: false,
      fec_creacion: notif.fec_creacion,
    });
  }

  return notif;
};

export default { send };
