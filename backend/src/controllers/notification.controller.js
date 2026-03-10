import {
  listOrderNotificationForUser,
  markOrderNotificationRead,
  getUnreadNotificationCountForUser,
  listMessageNotificationForUser,
  markMessageNotificationRead,
  getUnreadMessageNotificationCountForUser,
} from '../services/notification.service.js';

export const listOrderNotifications = async (req, res, next) => {
  try {
    const unread = String(req.query.unread || '').toLowerCase() === 'true';
    const limit = Number(req.query.limit || 50);

    const rows = await listOrderNotificationForUser({
      userId: req.user._id,
      unreadOnly: unread,
      limit,
    });

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const markOrderNotificationsRead = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const result = await markOrderNotificationRead({
      userId: req.user._id,
      ids,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const count = await getUnreadNotificationCountForUser({
      userId: req.user._id,
    });

    return res.status(200).json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};

export const listMessageNotifications = async (req, res, next) => {
  try {
    const unread = String(req.query.unread || '').toLowerCase() === 'true';
    const limit = Number(req.query.limit || 50);

    const rows = await listMessageNotificationForUser({
      userId: req.user._id,
      unreadOnly: unread,
      limit,
    });

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const markMessageNotificationsRead = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const result = await markMessageNotificationRead({
      userId: req.user._id,
      ids,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getUnreadMessageNotificationCount = async (req, res, next) => {
  try {
    const count = await getUnreadMessageNotificationCountForUser({
      userId: req.user._id,
    });

    return res.status(200).json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};
