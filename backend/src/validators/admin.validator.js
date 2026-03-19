import { USER_ROLE } from '../constants/order.constants.js';

const allowedRoles = new Set(Object.values(USER_ROLE));

export const validateCreateUser = (req, res, next) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const name = String(req.body?.name || '').trim();
  const role = String(req.body?.role || '').trim().toLowerCase();
  const address = req.body?.address;
  const phone = req.body?.phone;
  const maxCapacityGallons = req.body?.maxCapacityGallons;

  if (!email || !password || !name || !role) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email, password, name, and role',
    });
  }
  if (name.length < 6 || name.length > 30) {
    return res.status(400).json({ success: false, message: 'Name must be between 6 and 30 characters' });
  }
  if (email.length < 6 || email.length > 30) {
    return res.status(400).json({ success: false, message: 'Email must be between 6 and 30 characters' });
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
  if (role === USER_ROLE.RIDER && (!phone || !String(phone).trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide phone for rider accounts',
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
  if ((role === USER_ROLE.CUSTOMER || role === USER_ROLE.RIDER) && phone && !/^\d{11}$/.test(String(phone))) {
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
  req.body.email = email;
  req.body.name = name;
  req.body.role = role;
  next();
};

export const validateUpdateUser = (req, res, next) => {
  const email = req.body?.email !== undefined ? String(req.body.email).trim().toLowerCase() : undefined;
  const name = req.body?.name !== undefined ? String(req.body.name).trim() : undefined;
  const address = req.body?.address;
  const phone = req.body?.phone;
  const role = req.body?.role !== undefined ? String(req.body.role).trim().toLowerCase() : undefined;
  const password = req.body?.password;
  const maxCapacityGallons = req.body?.maxCapacityGallons;

  if (!email && !name && !address && !phone && !role && !password && maxCapacityGallons === undefined) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }
  if (role && !allowedRoles.has(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  if (name !== undefined && (name.length < 6 || name.length > 30)) {
    return res.status(400).json({ success: false, message: 'Name must be between 6 and 30 characters' });
  }
  if (email !== undefined && (email.length < 6 || email.length > 30)) {
    return res.status(400).json({ success: false, message: 'Email must be between 6 and 30 characters' });
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
  if (email !== undefined) req.body.email = email;
  if (name !== undefined) req.body.name = name;
  if (role !== undefined) req.body.role = role;
  next();
};
