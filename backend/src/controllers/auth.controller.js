// e:\Aquaflow\backend\src\controllers\auth.controller.js
import * as authService from '../services/auth.service.js';
import { MESSAGES } from '../constants/messages.js';
import User from '../models/User.model.js';
import Customer from '../models/Customer.model.js';
import Rider from '../models/Rider.model.js';

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
    const { email, password, name, address, phone } = req.body;
    const data = await authService.registerUser(email, password, name, address, phone);
    res.cookie('refreshToken', data.refreshToken, cookieOptions);
    res.status(201).json({
      success: true,
      token: data.accessToken,
      user: { id: data._id, email: data.email, name: data.name, address: data.address, phone: data.phone, role: data.role }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.loginUser(email, password);
    res.cookie('refreshToken', data.refreshToken, cookieOptions);
    res.status(200).json({
      success: true,
      token: data.accessToken,
      user: { id: data._id, email: data.email, name: data.name, address: data.address, phone: data.phone, role: data.role }
    });
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

export const getMe = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ user_id: req.user._id });
    const rider = await Rider.findOne({ user_id: req.user._id });
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        address: customer?.address,
        phone: req.user.role === 'rider' ? rider?.phone : customer?.phone,
        rider: rider
          ? {
              id: rider._id,
              maxCapacityGallons: rider.maxCapacityGallons,
              currentLoadGallons: rider.currentLoadGallons,
              activeOrdersCount: rider.activeOrdersCount,
            }
          : null,
        createdAt: req.user.createdAt,
        created_at: req.user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const { name, address, phone, currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!name && !address && !phone && !newPassword) {
      return res.status(400).json({ success: false, message: 'No profile updates provided' });
    }

    if (phone !== undefined && phone !== null && phone !== '') {
      if (!/^\d{11}$/.test(String(phone))) {
        return res.status(400).json({ success: false, message: 'Phone number must be exactly 11 digits' });
      }
    }

    let user = null;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required' });
      }
      if (!confirmPassword || newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
      }
      const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!strongPassword.test(String(newPassword))) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character',
        });
      }

      user = await User.findById(req.user._id).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    } else {
      user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    }

    if (name) {
      const normalizedName = String(name).trim();
      if (normalizedName.length < 6 || normalizedName.length > 30) {
        return res.status(400).json({ success: false, message: 'Name must be between 6 and 30 characters' });
      }
      user.name = normalizedName;
    }

    await user.save();

    if (user.role === 'customer' && (address || phone)) {
      await Customer.findOneAndUpdate(
        { user_id: user._id },
        { $set: { ...(address ? { address } : {}), ...(phone ? { phone } : {}) } },
        { upsert: true }
      );
    }
    if (user.role === 'rider' && phone) {
      await Rider.findOneAndUpdate(
        { user_id: user._id },
        { $set: { phone } },
        { upsert: true }
      );
    }

    const customer = await Customer.findOne({ user_id: user._id });
    const rider = await Rider.findOne({ user_id: user._id });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        address: customer?.address,
        phone: user.role === 'rider' ? rider?.phone : customer?.phone,
        role: user.role,
        createdAt: user.createdAt,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};
