// src/api/chat/chat.routes.js
import express from 'express';
import chatController from './controller/chat.controller.js';
const router = express.Router();

router.post('/getConversation', chatController.getConversationById);
router.post('/getMessages', chatController.getMessagesById);
router.post('/sendMessage', chatController.sendMessage);
router.post('/conversation', chatController.getOrCreateConversation);

router.post('/getChatListClient', chatController.getChatListClient);
router.post('/getChatListPhotographer', chatController.getChatListPhotographer);


export default router;
