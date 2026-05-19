import notificationDao from '../api/notifications/dao/notification.dao.js';

/**
 * notification.socket.js
 *
 * Maneja eventos de notificaciones en tiempo real desde el cliente.
 */
export default function notificationSocket(io, socket) {

  // El cliente puede unirse manualmente a su room (para compatibilidad
  // con versiones que no envían token en el handshake)
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 join_user: socket ${socket.id} → room user_${userId}`);
  });

  // Marcar una notificación como leída desde el cliente
  socket.on('notification:read', async ({ notifId, userId }) => {
    try {
      await notificationDao.markAsRead(Number(notifId), Number(userId));
      // Confirmar al cliente
      socket.emit('notification:read_ack', { notifId });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  });

  // Marcar todas como leídas
  socket.on('notification:read_all', async ({ userId }) => {
    try {
      await notificationDao.markAllAsRead(Number(userId));
      socket.emit('notification:read_all_ack');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  });
}
