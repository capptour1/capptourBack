import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';

const geTransaction = async () => {
    return await sequelize.transaction({ autocommit: false });
}

const getMessagesByConversation = async (conversationId) => {
  return await sequelize.query(
    `
    SELECT
      cm.id_mensaje,
      cm.id_conversacion,
      cm.emisor AS sender_id,
      cm.contenido,
      cm.fec_creacion,
      cm.fec_lectura
    FROM chat.mensajes cm
    WHERE cm.id_conversacion = CAST(:conversationId AS INT)
    ORDER BY cm.fec_creacion ASC
    `,
    {
      replacements: { conversationId },
      type: QueryTypes.SELECT
    }
  );
};


const getConversationById = async (conversationId) => {
  const conversation = await sequelize.query(
    `
    SELECT
      c.id_conversacion,
      c.tipo,
      c.id_cliente,
      u.nombre_completo AS nombre_cliente,
      c.id_fotografo,
      u2.nombre_completo AS nombre_fotografo,
      c.id_sesion,
      c.fec_creacion,
      c.fec_update
    FROM chat.conversacion c
    JOIN auth.usuarios u ON c.id_cliente = u.id
    JOIN fotografo.fotografos f ON c.id_fotografo = f.id
    JOIN auth.usuarios u2 ON f.id_usuario = u2.id
    WHERE c.id_conversacion = CAST(:conversationId AS INT)
    `,
    {
      replacements: { conversationId },
      type: QueryTypes.SELECT
    }
  );

  return conversation[0];
};



const insertMessage = async ({ conversationId, senderId, content }) => {
  const [result] = await sequelize.query(
    `
    INSERT INTO chat.mensajes
      (id_conversacion, emisor, contenido)
    VALUES
      (CAST(:conversationId AS INT), :senderId, :content)
    RETURNING
      id_mensaje,
      id_conversacion,
      emisor AS sender_id,
      contenido,
      fec_creacion
    `,
    {
      replacements: { conversationId, senderId, content },
      type: QueryTypes.INSERT
    }
  );

  return result[0];
};


const findDirectConversation = async (clientId, photographerId, transaction) => {
  const conversacion = await sequelize.query(
    `
    SELECT *
    FROM chat.conversacion c
    WHERE c.tipo = 1
      AND id_cliente = :clientId
      AND id_fotografo = :photographerId
    LIMIT 1
    `,
    {
      replacements: { clientId, photographerId },
      type: QueryTypes.SELECT,
      transaction
    }
  );

  return conversacion[0];
};


const createDirectConversation = async (clientId, photographerId, transaction) => {
  const [conversacion] = await sequelize.query(
    `
    INSERT INTO chat.conversacion (
      tipo,
      id_cliente,
      id_fotografo
    )
    VALUES (
      1,
      :clientId,
      :photographerId
    )
    RETURNING *
    `,
    {
      replacements: { clientId, photographerId },
      type: QueryTypes.INSERT,
      transaction
    }
  );

  return conversacion[0];
};




const findSessionConversation = async (sessionId, transaction) => {
  const conversacion = await sequelize.query(
    `
    SELECT *
    FROM chat.conversacion
    WHERE tipo = 2
      AND id_reserva = :sessionId
    LIMIT 1
    `,
    {
      replacements: { sessionId },
      type: QueryTypes.SELECT,
      transaction
    }
  );

  return conversacion[0];
};


const createSessionConversation = async ({
  sessionId,
  clientId,
  photographerId,
  transaction 
}) => {
  const [conversacion] = await sequelize.query(
    `
    INSERT INTO conversacion (
      tipo,
      id_cliente,
      id_fotografo,
      id_reserva
    )
    VALUES (
      2,
      :clientId,
      :photographerId,
      :sessionId
    )
    RETURNING *
    `,
    {
      replacements: { sessionId, clientId, photographerId },
      type: QueryTypes.INSERT,
      transaction
    }
  );

  return conversacion[0];
};

const getInfoConversationById = async (conversationId, transaction) => {
  const conversation = await sequelize.query(
    `SELECT c.id_chat AS id_conversacion, c.tipo, u.nombre_completo AS nombre_cliente,
      u2.nombre_completo AS nombre_fotografo, c.id_cliente, c.id_fotografo, c.id_reserva,
      c.fec_creacion, c.fec_update
    FROM chat.conversacion c
    JOIN auth.usuarios u ON c.id_cliente = u.id
    JOIN fotografo.fotografos f ON c.id_fotografo = f.id
    JOIN auth.usuarios u2 ON f.usuario_id = u2.id
    WHERE c.id_chat = CAST(:conversationId AS INT)
    `,
    {
      replacements: { conversationId },
      type: QueryTypes.SELECT,
      transaction
    }
  );

  return conversation[0];
};




export default {
    geTransaction,
    getMessagesByConversation,
    getConversationById,
    insertMessage,
    findDirectConversation,
    createDirectConversation,
    findSessionConversation,
    createSessionConversation,
    getInfoConversationById
};
