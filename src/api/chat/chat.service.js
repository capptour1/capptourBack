import chatDao from './dao/chat.dao.js';

const createMessage = async ({ conversationId, senderId, content }) => {
  console.log('Creating message:', { conversationId, senderId, content });

  const conversation = await chatDao.getConversationById(conversationId);
  if (!conversation) {
    throw new Error('Conversación no existe');
  }
  console.log('Found conversation:', conversation);
  const isClient = senderId === Number(conversation.id_cliente);
  const isPhotographer =
    senderId === Number(conversation.usuario_fotografo_id);

  if (!isClient && !isPhotographer) {
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