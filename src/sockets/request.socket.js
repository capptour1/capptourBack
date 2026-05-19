import notificationService from '../api/notifications/notification.service.js';

export default function requestSocket(io, socket) {

  // El cliente se une a su room personal (compatibilidad con clientes sin token)
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  // ── Nueva solicitud de sesión (cliente → fotógrafo) ───────────────────
  socket.on('new_request', async (data) => {
    // data: { photographerId, clientId, sessionId, clientName }
    try {
      io.to(`user_${data.photographerId}`).emit('request_received', {
        sessionId: data.sessionId,
        from: data.clientId,
      });

      await notificationService.send(io, {
        userId: Number(data.photographerId),
        tipo: 'booking',
        titulo: 'Nueva solicitud de sesión',
        mensaje: `${data.clientName ?? 'Un cliente'} quiere reservar una sesión contigo`,
        payload: {
          route: 'requestPhotographer',
          sessionId: data.sessionId,
        },
      });
    } catch (err) {
      console.error('Error en new_request:', err);
    }
  });

  // ── Respuesta a solicitud (fotógrafo → cliente) ───────────────────────
  socket.on('request_response', async (data) => {
    // data: { clientId, photographerName, sessionId, accepted }
    try {
      io.to(`user_${data.clientId}`).emit('request_status', data);

      const accepted = data.accepted ?? data.status === 'accepted';
      await notificationService.send(io, {
        userId: Number(data.clientId),
        tipo: 'session',
        titulo: accepted ? 'Solicitud aceptada' : 'Solicitud rechazada',
        mensaje: accepted
          ? `${data.photographerName ?? 'El fotógrafo'} aceptó tu solicitud de sesión`
          : `${data.photographerName ?? 'El fotógrafo'} rechazó tu solicitud de sesión`,
        payload: {
          route: accepted ? 'bookingForm' : null,
          sessionId: data.sessionId,
        },
      });
    } catch (err) {
      console.error('Error en request_response:', err);
    }
  });

  // ── Entrega de fotos lista (fotógrafo → cliente) ──────────────────────
  socket.on('delivery_ready', async (data) => {
    // data: { clientId, photographerName, sessionId }
    try {
      await notificationService.send(io, {
        userId: Number(data.clientId),
        tipo: 'session',
        titulo: '¡Tus fotos están listas!',
        mensaje: `${data.photographerName ?? 'El fotógrafo'} subió las fotos de tu sesión`,
        payload: {
          route: 'deliverySessionPhotographer',
          sessionId: data.sessionId,
        },
      });
    } catch (err) {
      console.error('Error en delivery_ready:', err);
    }
  });

  // ── Calificación recibida (cliente → fotógrafo) ───────────────────────
  socket.on('rating_received', async (data) => {
    // data: { photographerId, clientName, sessionId, rating }
    try {
      await notificationService.send(io, {
        userId: Number(data.photographerId),
        tipo: 'rating',
        titulo: 'Nueva calificación',
        mensaje: `${data.clientName ?? 'Un cliente'} calificó tu sesión con ${data.rating ?? '⭐'} estrellas`,
        payload: {
          route: 'dashboardPhotographer',
          sessionId: data.sessionId,
        },
      });
    } catch (err) {
      console.error('Error en rating_received:', err);
    }
  });
}
