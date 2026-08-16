import chatDao from './dao/chat.dao.js';

/**
 * Crea un mensaje de chat validando que el remitente sea participante.
 *
 * Retorna { message, conversation } para evitar que el caller
 * tenga que hacer una segunda query a getConversationById.
 *
 * @param {object} opts
 * @param {number} opts.conversationId
 * @param {number} opts.senderId
 * @param {string|null} opts.content — puede ser null para mensajes de solo adjunto
 * @param {string} [opts.tipo='text'] — tipo de mensaje
 * @returns {{ message: object, conversation: object }}
 */
const createMessage = async ({ conversationId, senderId, content, tipo = 'text' }) => {
  const conversation = await chatDao.getConversationById(conversationId);
  if (!conversation) {
    throw new Error('Conversación no existe');
  }

  const isClient = senderId === Number(conversation.id_cliente);
  const isPhotographer = senderId === Number(conversation.usuario_fotografo_id);

  if (!isClient && !isPhotographer) {
    throw new Error('No autorizado');
  }

  const message = await chatDao.insertMessage({
    conversationId,
    senderId,
    content,
    tipo,
  });

  return { message, conversation };
};

export default {
  createMessage,
};
