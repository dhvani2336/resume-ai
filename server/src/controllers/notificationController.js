import { Notification } from '../models/notificationModel.js';

export const getUserNotifications = async (req, res, next) => {
  try {
    const list = await Notification.findByUserId(req.user.id);
    return res.status(200).json({
      success: true,
      notifications: list
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await Notification.markAsRead(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found.'
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized.'
      });
    }

    return res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await Notification.markAllAsRead(userId);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
};
