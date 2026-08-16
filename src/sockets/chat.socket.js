import chatService from '../api/chat/chat.service.js';
import notificationService from '../api/notifications/notification.service.js';
import chatDao from '../api/chat/dao/chat.dao.js';

export default function chatSocket(io, socket) {

  socket.on('chat:join', async (conversationId) => {
    try {
      const userId = socket.user?.id;
      if (!userId) return;

      const conversation = await chatDao.getConversationById(conversationId);
      if (!conversation) {
        socket.emit('chat:error', 'Conversación no encontrada');
        return;
      }

      const isParticipant =
        userId === Number(conversation.id_cliente) ||
        userId === Number(conversation.usuario_fotografo_id);

      if (!isParticipant) {
        socket.emit('chat:error', 'No autorizado');
        return;
      }

      socket.join(`chat:${conversationId}`);
      socket.data.currentChat = conversationId;
    } catch (err) {
      console.error('Error en chat:join:', err);
      socket.emit('chat:error', 'Error al unirse al chat');
    }
  });

  socket.on('chat:leave', (conversationId) => {
    try {
      socket.leave(`chat:${conversationId}`);
      socket.data.currentChat = null;
    } catch (err) {
      console.error('Error en chat:leave:', err);
    }
  });

  socket.on('chat:send', async ({ conversationId, message }) => {
    try {
      const senderId = socket.user?.id;
      if (!senderId) return;

      if (!conversationId || !message?.trim()) {
        socket.emit('chat:error', 'Mensaje inválido');
        return;
      }

      const { message: savedMessage, conversation } = await chatService.createMessage({
        conversationId,
        senderId,
        content: message.trim(),
      });

      // Emitir el mensaje a todos en la sala del chat
      io.to(`chat:${conversationId}`).emit('chat:new', savedMessage);

      // ── Notificación condicional ──────────────────────────────────────
      // Solo enviar si el destinatario NO está en el room de la conversación
      const recipientId =
        senderId === Number(conversation.id_cliente)
          ? Number(conversation.usuario_fotografo_id)
          : Number(conversation.id_cliente);

      const socketsInRoom = await io.in(`chat:${conversationId}`).fetchSockets();
      const recipientInRoom = socketsInRoom.some(s => s.user?.id === recipientId);

      if (!recipientInRoom) {
        await notificationService.send({
          userId: recipientId,
          tipo: 'message',
          titulo: 'Nuevo mensaje',
          mensaje: message.trim().length > 60
            ? message.trim().substring(0, 60) + '…'
            : message.trim(),
          action: 'OPEN_CHAT',
          payload: {
            conversationId: Number(conversationId),
            clientId: Number(conversation.id_cliente),
            photographerId: Number(conversation.id_fotografo),
          },
        });
      }

    } catch (err) {
      console.error('Error en chat:send:', err);
      socket.emit('chat:error', 'Error enviando mensaje');
    }
  });

  // ── Marcar mensajes como leídos ─────────────────────────────────────────
  socket.on('chat:read', async (conversationId) => {
    try {
      const userId = socket.user?.id;
      if (!userId || !conversationId) return;

      await chatDao.markMessagesAsRead(conversationId, userId);
    } catch (err) {
      console.error('Error en chat:read:', err);
    }
  });
}
