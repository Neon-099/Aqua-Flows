import { USER_ROLE } from '../constants/order.constants.js';

const allowedRoles = new Set(Object.values(USER_ROLE));

export const validateCreateUser = (req, res, next) => {
  const { email, password, name, address, phone, role } = req.body;
  if (!email || !password || !name || !address || !phone || !role) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email, password, name, address, phone, and role',
    });
  }
  if (!allowedRoles.has(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  next();
};

export const validateUpdateUser = (req, res, next) => {
  const { email, name, address, phone, role, password } = req.body;
  if (!email && !name && !address && !phone && !role && !password) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }
  if (role && !allowedRoles.has(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  next();
};
