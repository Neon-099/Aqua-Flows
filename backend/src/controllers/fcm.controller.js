import * as fcmService from '../services/fcm.service.js';

export const registerToken = async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'token is required' });
    }

    await fcmService.registerPushToken({
      userId: req.user._id,
      token,
      platform,
    });

    return res.status(200).json({
      success: true,
      message: 'FCM token registered',
    });
  } catch (error) {
    return next(error);
  }
};

export const unregisterToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'token is required' });
    }

    await fcmService.unregisterPushToken({
      userId: req.user._id,
      token,
    });

    return res.status(200).json({
      success: true,
      message: 'FCM token unregistered',
    });
  } catch (error) {
    return next(error);
  }
};

export const sendTestPush = async (req, res, next) => {
  try {
    const { title, body, data } = req.body;

    const result = await fcmService.sendPushToUser({
      userId: req.user._id,
      title: title || 'Aquaflow test notification',
      body: body || 'FCM is connected to your account.',
      data: {
        type: 'test',
        ...(data && typeof data === 'object' ? data : {}),
      },
    });

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    return next(error);
  }
};

