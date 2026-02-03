import express from 'express';
import { register, login, logout } from '../controllers/authControllers.js';
import requireAuth from '../middlewares/requireAuth.js';

const router = express.Router();

//URI 
router.post('/signup', register);
router.post('/login', login);
router.post('/logout', logout);

// Example of a protected route
router.get('/me', requireAuth, (req, res) => {
  res.send(req.currentUser);
});

export default router;