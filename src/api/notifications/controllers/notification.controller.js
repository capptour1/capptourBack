import notificationDao from '../dao/notification.dao.js';
import HelperResponse from '../../../utils/helperResponse.js';
import AppError from '../../../utils/appError.js';

const { successResponse, errorResponse } = HelperResponse;

/** GET /api/notifications?userId=&limit=&offset= */
const getNotifications = async (req, res) => {
  try {
    const { userId, limit = 50, offset = 0 } = req.body;
    if (!userId) throw new AppError('userId requerido', 400);

    const notifications = await notificationDao.findByUser(
      Number(userId),
      Number(limit),
      Number(offset)
    );
    const unread = await notificationDao.countUnread(Number(userId));

    return successResponse(res, { notifications, unread }, 'OK');
  } catch (error) {
    return errorResponse(res, error);
  }
};

/** POST /api/notifications/markRead  { userId, notifId } */
const markRead = async (req, res) => {
  try {
    const { userId, notifId } = req.body;
    if (!userId || !notifId) throw new AppError('userId y notifId requeridos', 400);

    await notificationDao.markAsRead(Number(notifId), Number(userId));
    return successResponse(res, {}, 'Notificación marcada como leída');
  } catch (error) {
    return errorResponse(res, error);
  }
};

/** POST /api/notifications/markAllRead  { userId } */
const markAllRead = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) throw new AppError('userId requerido', 400);

    await notificationDao.markAllAsRead(Number(userId));
    return successResponse(res, {}, 'Todas las notificaciones marcadas como leídas');
  } catch (error) {
    return errorResponse(res, error);
  }
};

/** POST /api/notifications/delete  { userId, notifId } */
const deleteNotification = async (req, res) => {
  try {
    const { userId, notifId } = req.body;
    if (!userId || !notifId) throw new AppError('userId y notifId requeridos', 400);

    await notificationDao.remove(Number(notifId), Number(userId));
    return successResponse(res, {}, 'Notificación eliminada');
  } catch (error) {
    return errorResponse(res, error);
  }
};

export default {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
};
