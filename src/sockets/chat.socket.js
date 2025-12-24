import chatService from '../api/chat/chat.service.js';

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
      console.log('Mensaje recibido:', { conversationId, message });
      if (!conversationId || !message?.trim()) {
        socket.emit('chat:error', 'Mensaje inválido');
        return;
      }

      //const senderId = socket.user.id; // Cuando se implemente auth

      const savedMessage = await chatService.createMessage({
        conversationId,
        senderId,
        content: message.trim(),
      });

      io.to(`chat:${conversationId}`)
        .emit('chat:new', savedMessage);

    } catch (err) {
      console.error(err);
      socket.emit('chat:error', 'Error enviando mensaje');
    }
  });
}
