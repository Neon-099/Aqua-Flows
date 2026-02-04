// e:\Aquaflow\backend\src\services\auth.service.js
import User from '../models/User.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { sendEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';
import { env } from '../config/env.js';

export const registerUser = async (email, password) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists');
  }
  const user = await User.create({ email, password });
  return {
    _id: user._id,
    email: user.email,
    accessToken: generateAccessToken(user._id),
    refreshToken: generateRefreshToken(user._id),
  };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new Error('Invalid credentials');
  }
  return {
    _id: user._id,
    email: user.email,
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
    throw new Error('User not found');
  }
  const resetToken = user.getResetPasswordToken();
  await user.save();

  const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;
  const message = `
    <h1>You have requested a password reset</h1>
    <p>Please go to this link to reset your password:</p>
    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
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
