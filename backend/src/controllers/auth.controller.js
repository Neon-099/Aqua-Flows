// e:\Aquaflow\backend\src\controllers\auth.controller.js
import * as authService from '../services/auth.service.js';
import { MESSAGES } from '../constants/messages.js';

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    // Cross-site cookies in production (web + mobile) require SameSite=None and Secure
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.registerUser(email, password);
    res.cookie('refreshToken', data.refreshToken, cookieOptions);
    res.status(201).json({ success: true, token: data.accessToken, user: { id: data._id, email: data.email } });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.loginUser(email, password);
    res.cookie('refreshToken', data.refreshToken, cookieOptions);
    res.status(200).json({ success: true, token: data.accessToken, user: { id: data._id, email: data.email } });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
    res.cookie('refreshToken', '', { ...cookieOptions, maxAge: 0 });
    res.status(200).json({ success: true, message: MESSAGES.LOGOUT_SUCCESS });
};

export const refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) throw new Error('Not authorized, no token');
        const data = await authService.refreshUserToken(token);
        res.cookie('refreshToken', data.refreshToken, cookieOptions);
        res.status(200).json({ success: true, token: data.accessToken });
    } catch (error) {
        next(error);
    }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.status(200).json({ success: true, message: MESSAGES.EMAIL_SENT });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;
    const token = await authService.resetPassword(resetToken, password);
    res.status(200).json({ success: true, token, message: MESSAGES.PASSWORD_RESET_SUCCESS });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
    res.status(200).json({ success: true, user: req.user });
}