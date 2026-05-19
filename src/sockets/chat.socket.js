import chatService from '../api/chat/chat.service.js';
import notificationService from '../api/notifications/notification.service.js';
import chatDao from '../api/chat/dao/chat.dao.js';

export default function chatSocket(io, socket) {

  socket.on('chat:join', (conversationId) => {
    try {
      socket.join(`chat:${conversationId}`);
    } catch (err) {
      console.error(err);
      socket.emit('chat:error', 'Error al unirse al chat');
    }
  });

  socket.on('chat:send', async ({ conversationId, senderId, message }) => {
    try {
      if (!conversationId || !message?.trim()) {
        socket.emit('chat:error', 'Mensaje inválido');
        return;
      }

      const savedMessage = await chatService.createMessage({
        conversationId,
        senderId,
        content: message.trim(),
      });

      // Emitir el mensaje a todos en la sala del chat
      io.to(`chat:${conversationId}`).emit('chat:new', savedMessage);

      // ── Notificación al destinatario ──────────────────────────────────
      // Obtener la conversación para saber quién es el otro participante
      const conversation = await chatDao.getConversationById(conversationId);
      if (conversation) {
        const recipientId =
          Number(senderId) === Number(conversation.id_cliente)
            ? Number(conversation.usuario_fotografo_id)
            : Number(conversation.id_cliente);

        await notificationService.send(io, {
          userId: recipientId,
          tipo: 'message',
          titulo: 'Nuevo mensaje',
          mensaje: message.trim().length > 60
            ? message.trim().substring(0, 60) + '…'
            : message.trim(),
          payload: {
            route: 'chatScreen',
            conversationId: Number(conversationId),
          },
        });
      }

    } catch (err) {
      console.error(err);
      socket.emit('chat:error', 'Error enviando mensaje');
    }
  });
}
