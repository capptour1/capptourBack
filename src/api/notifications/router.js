import express from 'express';
import notificationController from './controllers/notification.controller.js';

const router = express.Router();

router.post('/list',        notificationController.getNotifications);
router.post('/markRead',    notificationController.markRead);
router.post('/markAllRead', notificationController.markAllRead);
router.post('/delete',      notificationController.deleteNotification);

export default router;
