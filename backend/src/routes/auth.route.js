// e:\Aquaflow\backend\src\routes\auth.routes.js


import express from 'express';
import { register, login, logout, refreshToken, forgotPassword, resetPassword, getMe } from '../controllers/auth.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';

const router = express.Router();

//AUTH URI 
router.post('/signup', authLimiter, validateRegister, register);
router.post('/signin', authLimiter, validateLogin, login);
router.get('/logout', logout);
router.get('/refresh', refreshToken);
router.post('/forgotpassword', authLimiter, forgotPassword);
router.put('/resetpassword/:resetToken', authLimiter, resetPassword);
router.get('/me', protect, getMe);


// Protected Test Routes
router.get('/user', protect, authorize('user'), (req, res) => {
    res.status(200).json({success: true, data: 'User access granted'});
});

router.get('/rider', protect, authorize('rider'), (req, res) => {
    res.status(200).json({success: true, data: 'Rider access granted'});
});

router.get('/staff', protect, authorize('staff'), (req, res) => {
    res.status(200).json({success: true, data: 'Staff access granted'});
});

router.get('/admin', protect, authorize('admin'), (req, res) => {
    res.status(200).json({ success: true, data: 'Admin access granted' });
});

export default router;
