// src/api/chat/chat.routes.js
import express from 'express';
import chatController from './controller/chat.controller.js';
const router = express.Router();

router.post('/get-conversation', chatController.getConversationById);
router.post('/get-messages', chatController.getMessagesById);
router.post('/send-message', chatController.sendMessage);
router.post('/conversation', chatController.getOrCreateConversation);

export default router;
