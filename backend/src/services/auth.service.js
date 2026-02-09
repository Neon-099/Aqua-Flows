// e:\Aquaflow\backend\src\services\auth.service.js
import User from '../models/User.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { sendEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';
import { env } from '../config/env.js';

export const registerUser = async (email, password, name, address, phone) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists');
  }
  const user = await User.create({ email, password, name, address, phone });
  return {
    _id: user._id,
    email: user.email,
    name: user.name,
    address: user.address,
    phone: user.phone,
    accessToken: generateAccessToken(user._id),
    refreshToken: generateRefreshToken(user._id),
  };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const err = new Error('Email not found');
    err.statusCode = 401;
    throw err;
  }
  const passwordMatches = await user.matchPassword(password);
  if (!passwordMatches) {
    const err = new Error('Incorrect password');
    err.statusCode = 401;
    throw err;
  }
  return {
    _id: user._id,
    email: user.email,
    name: user.name,
    address: user.address,
    phone: user.phone,
    accessToken: generateAccessToken(user._id),
    refreshToken: generateRefreshToken(user._id),
  };
};

export const refreshUserToken = async (token) => {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error('User not found');
    
    return {
        accessToken: generateAccessToken(user._id),
        refreshToken: generateRefreshToken(user._id)
    }
}

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('Email not found');
    err.statusCode = 404;
    throw err;
  }
  const resetToken = user.getResetPasswordToken();
  await user.save();

  const message = `
    <h1>You have requested a password reset</h1>
    <p>Use this reset code to create a new password:</p>
    <p style="font-size: 22px; font-weight: 700; letter-spacing: 2px;">${resetToken}</p>
    <p>This code expires in 10 minutes.</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    throw new Error('Email could not be sent');
  }
};

export const resetPassword = async (resetToken, password) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error('Invalid token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return generateAccessToken(user._id);
};
