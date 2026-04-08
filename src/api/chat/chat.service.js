import chatDao from './dao/chat.dao.js';

const createMessage = async ({ conversationId, senderId, content }) => {

  const conversation = await chatDao.getConversationById(conversationId);
  if (!conversation) {
    throw new Error('Conversación no existe');
  }

  if (
    senderId !== Number(conversation.id_cliente) &&
    senderId !== Number(conversation.id_fotografo)
  ) {
    throw new Error('No autorizado');
  }

  // 2️⃣ guardar mensaje
  const message = await chatDao.insertMessage({
    conversationId,
    senderId,
    content
  });

  return message;
};

export default {
  createMessage
};