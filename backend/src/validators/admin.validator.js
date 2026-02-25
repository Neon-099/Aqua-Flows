import { USER_ROLE } from '../constants/order.constants.js';

const allowedRoles = new Set(Object.values(USER_ROLE));

export const validateCreateUser = (req, res, next) => {
  const { email, password, name, address, phone, role, maxCapacityGallons } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email, password, name, and role',
    });
  }
  if (!allowedRoles.has(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  if (role === USER_ROLE.CUSTOMER && (!address || !phone)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide address and phone for customer accounts',
    });
  }
  if (role === USER_ROLE.RIDER && (maxCapacityGallons === undefined || maxCapacityGallons === null)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide max gallon capacity for rider accounts',
    });
  }
  if (role === USER_ROLE.RIDER && Number.isNaN(Number(maxCapacityGallons))) {
    return res.status(400).json({ success: false, message: 'Max gallon capacity must be a number' });
  }
  if (role === USER_ROLE.RIDER && Number(maxCapacityGallons) < 1) {
    return res.status(400).json({ success: false, message: 'Max gallon capacity must be at least 1' });
  }
  if (role === USER_ROLE.CUSTOMER && phone && !/^\d{11}$/.test(String(phone))) {
    return res.status(400).json({ success: false, message: 'Phone number must be exactly 11 digits' });
  }
  if (password) {
    const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPassword.test(String(password))) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character',
      });
    }
  }
  next();
};

export const validateUpdateUser = (req, res, next) => {
  const { email, name, address, phone, role, password, maxCapacityGallons } = req.body;
  if (!email && !name && !address && !phone && !role && !password && maxCapacityGallons === undefined) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }
  if (role && !allowedRoles.has(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  if (role === USER_ROLE.CUSTOMER && (!address && !phone && !email && !name && !password)) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }
  if (phone && !/^\d{11}$/.test(String(phone))) {
    return res.status(400).json({ success: false, message: 'Phone number must be exactly 11 digits' });
  }
  if (maxCapacityGallons !== undefined) {
    if (Number.isNaN(Number(maxCapacityGallons))) {
      return res.status(400).json({ success: false, message: 'Max gallon capacity must be a number' });
    }
    if (Number(maxCapacityGallons) < 1) {
      return res.status(400).json({ success: false, message: 'Max gallon capacity must be at least 1' });
    }
  }
  if (password) {
    const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPassword.test(String(password))) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character',
      });
    }
  }
  next();
};
