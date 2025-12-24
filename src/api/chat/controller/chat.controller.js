
import HelperResponse from '../../../utils/helperResponse.js';
import chatDao from '../dao/chat.dao.js';
import AppError from '../../../utils/appError.js';
import * as chatService from '../chat.service.js';


const { successResponse, errorResponse } = HelperResponse;


const getConversationById = async (req, res) => {
  try {
    const { conversation_id } = req.body;
    const conversation = await chatDao.getConversationById(conversation_id);
    return successResponse(res, conversation);
  } catch (error) {
    throw new AppError('Error retrieving chat data', 500);
  }
};

const getMessagesById = async (req, res) => {
  try {
    const { conversation_id } = req.body;
    const messages = await chatDao.getMessagesByConversation(conversation_id);
    return successResponse(res, messages);
  } catch (error) {
    return errorResponse(res, 'Error retrieving messages', error);
  }
};

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { conversationId, message } = req.body;

    const savedMessage = await chatService.createMessage({
      conversationId,
      senderId,
      content: message
    });

    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



const getOrCreateConversation = async (req, res) => {
  let t = null;
  try {
    
    const { type, client_id, photographer_id, session_id } = req.body;

    t = await chatDao.geTransaction();
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
        conversation = await chatDao.createSessionConversation(session_id, client_id, photographer_id, t);
      }
    }
    const result = await chatDao.getInfoConversationById(conversation.id_chat, t);
    console.log('Conversation info:', result);
    await t.commit();
    return successResponse(res, result);

  } catch (error) {
    if (t) await t.rollback();
    return errorResponse(res, error);
  }
};


export default {
  getConversationById,
  getMessagesById,
  sendMessage,
  getOrCreateConversation
};

