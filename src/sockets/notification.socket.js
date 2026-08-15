import notificationDao from '../api/notifications/dao/notification.dao.js';

/**
 * notification.socket.js
 *
 * Maneja eventos de notificaciones en tiempo real desde el cliente.
 *
 * SEGURIDAD: Toda operación usa socket.user.id (del token JWT verificado
 * en el middleware de conexión). Nunca se confía en IDs enviados por el cliente.
 */
export default function notificationSocket(io, socket) {

  // Marcar una notificación como leída
  socket.on('notification:read', async ({ notifId }) => {
    try {
      const userId = socket.user?.id;
      if (!userId) return;

      await notificationDao.markAsRead(Number(notifId), userId);
      socket.emit('notification:read_ack', { notifId });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  });

  // Marcar todas como leídas
  socket.on('notification:read_all', async () => {
    try {
      const userId = socket.user?.id;
      if (!userId) return;

      await notificationDao.markAllAsRead(userId);
      socket.emit('notification:read_all_ack');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  });
}
