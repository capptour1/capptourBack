import chatService from '../api/chat/chat.service.js';

export default function chatSocket(io, socket) {

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const senderId = socket.user.id;

      const message = await chatService.createMessage({
        conversationId: data.conversationId,
        senderId,
        content: data.message
      });

      io.to(`conversation_${data.conversationId}`)
        .emit('new_message', message);

    } catch (err) {
      socket.emit('error_message', err.message);
    }
  });
}
