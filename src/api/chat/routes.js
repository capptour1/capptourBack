import express from 'express';
import multer from 'multer';
import chatController from './controller/chat.controller.js';
import authMiddleware from '../../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/getConversation', chatController.getConversationById);
router.post('/getMessages', chatController.getMessagesById);
router.post('/conversation', chatController.getOrCreateConversation);
router.post('/getChatListClient', chatController.getChatListClient);
router.post('/getChatListPhotographer', chatController.getChatListPhotographer);

// Upload de archivos — requiere autenticación
router.post('/upload', authMiddleware, upload.single('file'), chatController.uploadFile);

// Ocultar conversación — requiere autenticación
router.post('/hideConversation', authMiddleware, chatController.hideConversation);

export default router;
