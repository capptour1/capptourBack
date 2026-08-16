import HelperResponse from '../../../utils/helperResponse.js';
import chatDao from '../dao/chat.dao.js';
import AppError from '../../../utils/appError.js';
import storageService from '../../../services/storage.service.js';
import media from '../../../utils/media.js';

const { successResponse, errorResponse } = HelperResponse;
const { createThumbnail } = media;

// ─── Validación de archivos ───────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

// ─── Controllers ──────────────────────────────────────────────────────────────

const getConversationById = async (req, res) => {
  try {
    const { id_conversacion } = req.body;
    const conversation = await chatDao.getConversationById(id_conversacion);
    if (!conversation) {
      throw new AppError('Conversación no encontrada', 404);
    }
    return successResponse(res, conversation);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getMessagesById = async (req, res) => {
  try {
    const { id_conversacion, cursor, userId } = req.body;
    if (!id_conversacion) {
      throw new AppError('id_conversacion requerido', 400);
    }

    // Resolver visibleSince: la fecha desde la que el usuario puede ver mensajes
    let visibleSince = null;
    if (userId) {
      const conv = await chatDao.getConversationById(id_conversacion);
      if (conv) {
        if (userId === Number(conv.id_cliente)) {
          visibleSince = conv.fecha_oculto_cliente || null;
        } else if (userId === Number(conv.usuario_fotografo_id)) {
          visibleSince = conv.fecha_oculto_fotografo || null;
        }
      }
    }

    // Con cursor → paginación. Sin cursor → todos los mensajes visibles.
    const messages = cursor
      ? await chatDao.getMessagesPaginated(id_conversacion, cursor, 30, visibleSince)
      : await chatDao.getMessagesByConversation(id_conversacion, visibleSince);

    return successResponse(res, messages);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getOrCreateConversation = async (req, res) => {
  let t = null;
  try {
    const { type, client_id, photographer_id, session_id } = req.body;

    t = await chatDao.getTransaction();
    let conversation;

    if (type === 1) {
      conversation = await chatDao.findDirectConversation(
        client_id,
        photographer_id,
        t
      );

      if (!conversation) {
        conversation = await chatDao.createDirectConversation(
          client_id,
          photographer_id,
          t
        );
      }
    }

    if (type === 2) {
      conversation = await chatDao.findSessionConversation(session_id, t);

      if (!conversation) {
        conversation = await chatDao.createSessionConversation(
          session_id,
          client_id,
          photographer_id,
          t
        );
      }
    }

    // Si la conversación estaba oculta para quien la abre, reactivarla
    if (conversation.oculto_cliente && Number(client_id) === Number(conversation.id_cliente)) {
      await chatDao.reopenConversation(conversation.id_chat, 'client', t);
    }
    if (conversation.oculto_fotografo && Number(photographer_id) === Number(conversation.id_fotografo)) {
      await chatDao.reopenConversation(conversation.id_chat, 'photographer', t);
    }

    const result = await chatDao.getConversationById(conversation.id_chat, t);
    await t.commit();
    return successResponse(res, result);
  } catch (error) {
    if (t) await t.rollback();
    return errorResponse(res, error);
  }
};

const getChatListClient = async (req, res) => {
  try {
    const { id_usuario } = req.body;
    if (!id_usuario) {
      throw new AppError('id_usuario requerido', 400);
    }
    const chatList = await chatDao.getChatListClient(id_usuario);
    return successResponse(res, chatList);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getChatListPhotographer = async (req, res) => {
  try {
    const { id_fotografo } = req.body;
    if (!id_fotografo) {
      throw new AppError('id_fotografo requerido', 400);
    }
    const chatList = await chatDao.getChatListPhotographer(id_fotografo);
    return successResponse(res, chatList);
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Sube un archivo para una conversación de chat.
 *
 * Requiere autenticación (authMiddleware).
 * Valida que el usuario sea participante de la conversación.
 * Valida MIME type y tamaño.
 * Genera thumbnail para imágenes.
 * Persiste el adjunto en BD y retorna la información completa.
 *
 * Body: multipart/form-data con campo "file" + "conversationId"
 */
const uploadFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.body;
    const file = req.file;

    if (!conversationId) {
      throw new AppError('conversationId requerido', 400);
    }

    if (!file) {
      throw new AppError('Archivo requerido', 400);
    }

    // Validar participación
    const conversation = await chatDao.getConversationById(conversationId);
    if (!conversation) {
      throw new AppError('Conversación no encontrada', 404);
    }

    const isParticipant =
      userId === Number(conversation.id_cliente) ||
      userId === Number(conversation.usuario_fotografo_id);

    if (!isParticipant) {
      throw new AppError('No autorizado', 403);
    }

    // Validar MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError(`Tipo de archivo no permitido: ${file.mimetype}`, 400);
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError('El archivo excede el tamaño máximo de 25MB', 400);
    }

    // Determinar folder y tipo de mensaje según MIME
    let folder = 'chat/documents';
    let messageType = 'document';

    if (file.mimetype.startsWith('image/')) {
      folder = 'chat/images';
      messageType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'chat/videos';
      messageType = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      folder = 'chat/audio';
      messageType = 'audio';
    }

    // Subir archivo principal
    const uploaded = await storageService.upload(file.buffer, folder, file.originalname);

    // Generar thumbnail para imágenes
    let thumbnailPath = null;
    if (messageType === 'image') {
      const thumbBuffer = await createThumbnail(file);
      const thumbResult = await storageService.upload(thumbBuffer, 'chat/thumbnails', file.originalname);
      thumbnailPath = thumbResult.path;
    }

    // Crear mensaje de tipo archivo
    const message = await chatDao.insertMessage({
      conversationId: Number(conversationId),
      senderId: userId,
      content: null,
      tipo: messageType,
    });

    // Crear adjunto (almacena rutas relativas, nunca URLs)
    const attachment = await chatDao.insertAttachment({
      messageId: message.id_mensaje,
      url: uploaded.path,
      urlThumbnail: thumbnailPath,
      nombre: file.originalname,
      mimeType: file.mimetype,
      tamano: file.size,
    });

    // Respuesta con URLs públicas resueltas para el frontend
    const response = {
      ...message,
      adjuntos: [{
        ...attachment,
        url: storageService.getUrl(attachment.url),
        url_thumbnail: attachment.url_thumbnail ? storageService.getUrl(attachment.url_thumbnail) : null,
      }],
    };

    return successResponse(res, response, 'Archivo subido correctamente');
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Oculta una conversación para el usuario autenticado.
 * Requiere autenticación. Verifica participación.
 */
const hideConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.body;

    if (!conversationId) {
      throw new AppError('conversationId requerido', 400);
    }

    const conversation = await chatDao.getConversationById(conversationId);
    if (!conversation) {
      throw new AppError('Conversación no encontrada', 404);
    }

    // Determinar el rol del usuario en esta conversación
    let role;
    if (userId === Number(conversation.id_cliente)) {
      role = 'client';
    } else if (userId === Number(conversation.usuario_fotografo_id)) {
      role = 'photographer';
    } else {
      throw new AppError('No autorizado', 403);
    }

    await chatDao.hideConversation(conversationId, role);
    return successResponse(res, {}, 'Conversación ocultada');
  } catch (error) {
    return errorResponse(res, error);
  }
};

export default {
  getConversationById,
  getMessagesById,
  getOrCreateConversation,
  getChatListClient,
  getChatListPhotographer,
  uploadFile,
  hideConversation,
};
