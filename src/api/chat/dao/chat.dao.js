import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';

const STORAGE_URL = process.env.STORAGE_BASE_URL || 'http://localhost:3000/storage';

const getTransaction = async () => {
  return await sequelize.transaction({ autocommit: false });
};

// ─── Alias para compatibilidad con código existente ───────────────────────────
const geTransaction = getTransaction;

// ─── CONVERSACIONES ───────────────────────────────────────────────────────────

/**
 * Obtiene una conversación por ID con información de participantes.
 * Función unificada — reemplaza getConversationById + getInfoConversationById.
 */
const getConversationById = async (conversationId, transaction = null) => {
  const result = await sequelize.query(
    `
    SELECT
      c.id_chat AS id_conversacion,
      c.tipo,
      c.id_cliente,
      u.nombre_completo AS nombre_cliente,
      u.foto_perfil AS foto_cliente,
      c.id_fotografo,
      f.id_usuario AS usuario_fotografo_id,
      u2.nombre_completo AS nombre_fotografo,
      u2.foto_perfil AS foto_fotografo,
      c.id_reserva,
      c.oculto_cliente,
      c.oculto_fotografo,
      c.fecha_oculto_cliente,
      c.fecha_oculto_fotografo,
      c.fec_creacion,
      c.fec_update
    FROM chat.conversacion c
    JOIN auth.usuarios u ON c.id_cliente = u.id
    JOIN fotografo.fotografos f ON c.id_fotografo = f.id
    JOIN auth.usuarios u2 ON f.id_usuario = u2.id
    WHERE c.id_chat = CAST(:conversationId AS INT)
    `,
    {
      replacements: { conversationId },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result[0] ?? null;
};

// Alias para compatibilidad — los consumidores existentes no se rompen
const getInfoConversationById = getConversationById;

const findDirectConversation = async (clientId, photographerId, transaction) => {
  const result = await sequelize.query(
    `
    SELECT *
    FROM chat.conversacion
    WHERE tipo = 1
      AND id_cliente = :clientId
      AND id_fotografo = :photographerId
    LIMIT 1
    `,
    {
      replacements: { clientId, photographerId },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result[0] ?? null;
};

const createDirectConversation = async (clientId, photographerId, transaction) => {
  const [result] = await sequelize.query(
    `
    INSERT INTO chat.conversacion (tipo, id_cliente, id_fotografo)
    VALUES (1, :clientId, :photographerId)
    RETURNING *
    `,
    {
      replacements: { clientId, photographerId },
      type: QueryTypes.INSERT,
      transaction,
    }
  );

  return result[0];
};

const findSessionConversation = async (sessionId, transaction) => {
  const result = await sequelize.query(
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
      transaction,
    }
  );

  return result[0] ?? null;
};

const createSessionConversation = async (sessionId, clientId, photographerId, transaction) => {
  const [result] = await sequelize.query(
    `
    INSERT INTO chat.conversacion (tipo, id_cliente, id_fotografo, id_reserva)
    VALUES (2, :clientId, :photographerId, :sessionId)
    RETURNING *
    `,
    {
      replacements: { sessionId, clientId, photographerId },
      type: QueryTypes.INSERT,
      transaction,
    }
  );

  return result[0];
};

/**
 * Actualiza fec_update de una conversación (se llama al enviar un mensaje).
 */
const updateConversationTimestamp = async (conversationId) => {
  await sequelize.query(
    `UPDATE chat.conversacion SET fec_update = NOW() WHERE id_chat = CAST(:conversationId AS INT)`,
    {
      replacements: { conversationId },
      type: QueryTypes.UPDATE,
    }
  );
};

/**
 * Chat list optimizado para CLIENTES.
 * Un solo query con subqueries para último mensaje y no leídos.
 * Filtra conversaciones ocultas. Respeta fecha de ocultamiento en contadores.
 */
const getChatListClient = async (clientId) => {
  return await sequelize.query(
    `
    SELECT
      c.id_chat AS id_conversacion,
      c.tipo,
      u.nombre_completo AS nombre_cliente,
      u.foto_perfil AS foto_cliente,
      u2.nombre_completo AS nombre_fotografo,
      u2.foto_perfil AS foto_fotografo,
      c.id_cliente,
      c.id_fotografo,
      c.id_reserva,
      c.fec_creacion,
      c.fec_update,
      (SELECT row_to_json(sub) FROM (
        SELECT id_mensaje, emisor AS sender_id, contenido, fec_creacion, fec_lectura
        FROM chat.mensajes
        WHERE id_conversacion = c.id_chat
          AND eliminado = FALSE
          AND fec_creacion > COALESCE(c.fecha_oculto_cliente, '1900-01-01'::timestamptz)
        ORDER BY fec_creacion DESC LIMIT 1
      ) sub) AS ultimo_mensaje,
      (SELECT COUNT(*) FROM chat.mensajes
        WHERE id_conversacion = c.id_chat
        AND fec_lectura IS NULL
        AND emisor != CAST(:clientId AS INT)
        AND eliminado = FALSE
        AND fec_creacion > COALESCE(c.fecha_oculto_cliente, '1900-01-01'::timestamptz)
      )::int AS no_leidos
    FROM chat.conversacion c
    JOIN auth.usuarios u ON c.id_cliente = u.id
    JOIN fotografo.fotografos f ON c.id_fotografo = f.id
    JOIN auth.usuarios u2 ON f.id_usuario = u2.id
    WHERE c.id_cliente = CAST(:clientId AS INT)
      AND c.oculto_cliente = FALSE
    ORDER BY c.fec_update DESC NULLS LAST, c.fec_creacion DESC
    `,
    {
      replacements: { clientId },
      type: QueryTypes.SELECT,
    }
  );
};

/**
 * Chat list optimizado para FOTÓGRAFOS.
 * Mismo patrón que getChatListClient pero filtrado por id_fotografo.
 */
const getChatListPhotographer = async (photographerId) => {
  return await sequelize.query(
    `
    SELECT
      c.id_chat AS id_conversacion,
      c.tipo,
      u.nombre_completo AS nombre_cliente,
      u.foto_perfil AS foto_cliente,
      u2.nombre_completo AS nombre_fotografo,
      u2.foto_perfil AS foto_fotografo,
      c.id_cliente,
      c.id_fotografo,
      c.id_reserva,
      c.fec_creacion,
      c.fec_update,
      (SELECT row_to_json(sub) FROM (
        SELECT id_mensaje, emisor AS sender_id, contenido, fec_creacion, fec_lectura
        FROM chat.mensajes
        WHERE id_conversacion = c.id_chat
          AND eliminado = FALSE
          AND fec_creacion > COALESCE(c.fecha_oculto_fotografo, '1900-01-01'::timestamptz)
        ORDER BY fec_creacion DESC LIMIT 1
      ) sub) AS ultimo_mensaje,
      (SELECT COUNT(*) FROM chat.mensajes
        WHERE id_conversacion = c.id_chat
        AND fec_lectura IS NULL
        AND emisor != (SELECT id_usuario FROM fotografo.fotografos WHERE id = c.id_fotografo)
        AND eliminado = FALSE
        AND fec_creacion > COALESCE(c.fecha_oculto_fotografo, '1900-01-01'::timestamptz)
      )::int AS no_leidos
    FROM chat.conversacion c
    JOIN auth.usuarios u ON c.id_cliente = u.id
    JOIN fotografo.fotografos f ON c.id_fotografo = f.id
    JOIN auth.usuarios u2 ON f.id_usuario = u2.id
    WHERE c.id_fotografo = CAST(:photographerId AS INT)
      AND c.oculto_fotografo = FALSE
    ORDER BY c.fec_update DESC NULLS LAST, c.fec_creacion DESC
    `,
    {
      replacements: { photographerId },
      type: QueryTypes.SELECT,
    }
  );
};

// ─── MENSAJES ─────────────────────────────────────────────────────────────────

/**
 * Carga todos los mensajes (mantiene compatibilidad con frontend actual).
 * Excluye mensajes eliminados y anteriores a visibleSince (fecha de ocultamiento).
 * Incluye adjuntos como array JSON con URLs resueltas.
 */
const getMessagesByConversation = async (conversationId, visibleSince = null) => {
  const sinceCondition = visibleSince
    ? `AND cm.fec_creacion > CAST(:visibleSince AS TIMESTAMPTZ)`
    : '';

  return await sequelize.query(
    `
    SELECT
      cm.id_mensaje,
      cm.id_conversacion,
      cm.emisor AS sender_id,
      cm.contenido,
      cm.tipo,
      cm.fec_creacion,
      cm.fec_lectura,
      COALESCE(
        (SELECT json_agg(row_to_json(a)) FROM (
          SELECT
            id_adjunto,
            id_mensaje,
            CASE WHEN url LIKE 'http%' THEN url ELSE :storageUrl || '/' || url END AS url,
            CASE WHEN url_thumbnail IS NULL THEN NULL
                 WHEN url_thumbnail LIKE 'http%' THEN url_thumbnail
                 ELSE :storageUrl || '/' || url_thumbnail END AS url_thumbnail,
            nombre,
            mime_type,
            tamano,
            fec_creacion
          FROM chat.adjuntos
          WHERE id_mensaje = cm.id_mensaje
          ORDER BY fec_creacion ASC
        ) a),
        '[]'::json
      ) AS adjuntos
    FROM chat.mensajes cm
    WHERE cm.id_conversacion = CAST(:conversationId AS INT)
      AND cm.eliminado = FALSE
      ${sinceCondition}
    ORDER BY cm.fec_creacion ASC
    `,
    {
      replacements: { conversationId, visibleSince, storageUrl: STORAGE_URL },
      type: QueryTypes.SELECT,
    }
  );
};

/**
 * Carga mensajes con paginación por cursor (timestamp).
 * Retorna los N mensajes anteriores al cursor, ordenados ASC para que el frontend
 * los muestre de más antiguo a más reciente.
 *
 * @param {number} conversationId
 * @param {string|null} cursor — ISO timestamp. Si es null, carga los más recientes.
 * @param {number} limit — cantidad de mensajes a cargar (default 30)
 * @param {string|null} visibleSince — no retornar mensajes anteriores a esta fecha
 */
const getMessagesPaginated = async (conversationId, cursor = null, limit = 30, visibleSince = null) => {
  const cursorCondition = cursor
    ? `AND cm.fec_creacion < CAST(:cursor AS TIMESTAMPTZ)`
    : '';
  const sinceCondition = visibleSince
    ? `AND cm.fec_creacion > CAST(:visibleSince AS TIMESTAMPTZ)`
    : '';

  const messages = await sequelize.query(
    `
    SELECT
      cm.id_mensaje,
      cm.id_conversacion,
      cm.emisor AS sender_id,
      cm.contenido,
      cm.tipo,
      cm.fec_creacion,
      cm.fec_lectura,
      COALESCE(
        (SELECT json_agg(row_to_json(a)) FROM (
          SELECT
            id_adjunto,
            id_mensaje,
            CASE WHEN url LIKE 'http%' THEN url ELSE :storageUrl || '/' || url END AS url,
            CASE WHEN url_thumbnail IS NULL THEN NULL
                 WHEN url_thumbnail LIKE 'http%' THEN url_thumbnail
                 ELSE :storageUrl || '/' || url_thumbnail END AS url_thumbnail,
            nombre,
            mime_type,
            tamano,
            fec_creacion
          FROM chat.adjuntos
          WHERE id_mensaje = cm.id_mensaje
          ORDER BY fec_creacion ASC
        ) a),
        '[]'::json
      ) AS adjuntos
    FROM chat.mensajes cm
    WHERE cm.id_conversacion = CAST(:conversationId AS INT)
      AND cm.eliminado = FALSE
      ${cursorCondition}
      ${sinceCondition}
    ORDER BY cm.fec_creacion DESC
    LIMIT :limit
    `,
    {
      replacements: { conversationId, cursor, limit, visibleSince, storageUrl: STORAGE_URL },
      type: QueryTypes.SELECT,
    }
  );

  // Retornar en orden cronológico (ASC) para el frontend
  return messages.reverse();
};

/**
 * Inserta un mensaje.
 * Acepta tipo (default 'text') para soportar mensajes con adjuntos.
 * Actualiza fec_update de la conversación en la misma operación.
 */
const insertMessage = async ({ conversationId, senderId, content, tipo = 'text' }) => {
  const [result] = await sequelize.query(
    `
    INSERT INTO chat.mensajes
      (id_conversacion, emisor, contenido, tipo)
    VALUES
      (CAST(:conversationId AS INT), :senderId, :content, :tipo)
    RETURNING
      id_mensaje,
      id_conversacion,
      emisor AS sender_id,
      contenido,
      tipo,
      fec_creacion
    `,
    {
      replacements: { conversationId, senderId, content, tipo },
      type: QueryTypes.INSERT,
    }
  );

  // Actualizar timestamp de actividad de la conversación
  await updateConversationTimestamp(conversationId);

  return result[0];
};

/**
 * Marca como leídos todos los mensajes de una conversación que no sean del usuario actual.
 * Solo marca los que aún no tienen fec_lectura.
 */
const markMessagesAsRead = async (conversationId, userId) => {
  await sequelize.query(
    `
    UPDATE chat.mensajes
    SET fec_lectura = NOW()
    WHERE id_conversacion = CAST(:conversationId AS INT)
      AND emisor != CAST(:userId AS INT)
      AND fec_lectura IS NULL
      AND eliminado = FALSE
    `,
    {
      replacements: { conversationId, userId },
      type: QueryTypes.UPDATE,
    }
  );
};

// ─── ADJUNTOS ─────────────────────────────────────────────────────────────────

/**
 * Inserta un adjunto asociado a un mensaje.
 */
const insertAttachment = async ({ messageId, url, urlThumbnail = null, nombre = null, mimeType, tamano = null }) => {
  const [result] = await sequelize.query(
    `
    INSERT INTO chat.adjuntos
      (id_mensaje, url, url_thumbnail, nombre, mime_type, tamano)
    VALUES
      (CAST(:messageId AS INT), :url, :urlThumbnail, :nombre, :mimeType, :tamano)
    RETURNING *
    `,
    {
      replacements: { messageId, url, urlThumbnail, nombre, mimeType, tamano },
      type: QueryTypes.INSERT,
    }
  );

  return result[0];
};

/**
 * Obtiene los adjuntos de un mensaje.
 */
const getAttachmentsByMessageId = async (messageId) => {
  return await sequelize.query(
    `
    SELECT
      id_adjunto,
      id_mensaje,
      url,
      url_thumbnail,
      nombre,
      mime_type,
      tamano,
      fec_creacion
    FROM chat.adjuntos
    WHERE id_mensaje = CAST(:messageId AS INT)
    ORDER BY fec_creacion ASC
    `,
    {
      replacements: { messageId },
      type: QueryTypes.SELECT,
    }
  );
};

/**
 * Oculta una conversación para un rol específico (soft-delete per-user).
 * Guarda el timestamp para filtrar historial visible.
 * @param {number} conversationId
 * @param {'client'|'photographer'} role
 */
const hideConversation = async (conversationId, role) => {
  const flagCol = role === 'client' ? 'oculto_cliente' : 'oculto_fotografo';
  const dateCol = role === 'client' ? 'fecha_oculto_cliente' : 'fecha_oculto_fotografo';
  await sequelize.query(
    `UPDATE chat.conversacion SET ${flagCol} = TRUE, ${dateCol} = NOW() WHERE id_chat = CAST(:conversationId AS INT)`,
    {
      replacements: { conversationId },
      type: QueryTypes.UPDATE,
    }
  );
};

/**
 * Reabre una conversación ocultada (resetea el flag, conserva fecha_oculto).
 * Se llama cuando getOrCreateConversation encuentra una conversación oculta.
 * @param {number} conversationId
 * @param {'client'|'photographer'} role
 * @param {object} [transaction]
 */
const reopenConversation = async (conversationId, role, transaction = null) => {
  const flagCol = role === 'client' ? 'oculto_cliente' : 'oculto_fotografo';
  await sequelize.query(
    `UPDATE chat.conversacion SET ${flagCol} = FALSE WHERE id_chat = CAST(:conversationId AS INT)`,
    {
      replacements: { conversationId },
      type: QueryTypes.UPDATE,
      transaction,
    }
  );
};

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

export default {
  geTransaction,
  getTransaction,
  getConversationById,
  getInfoConversationById,
  findDirectConversation,
  createDirectConversation,
  findSessionConversation,
  createSessionConversation,
  updateConversationTimestamp,
  hideConversation,
  reopenConversation,
  getChatListClient,
  getChatListPhotographer,
  getMessagesByConversation,
  getMessagesPaginated,
  insertMessage,
  markMessagesAsRead,
  insertAttachment,
  getAttachmentsByMessageId,
};
