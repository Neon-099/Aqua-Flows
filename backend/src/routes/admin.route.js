import express from 'express';
import {
  archiveUser,
  createUser,
  getUsers,
  restoreUser,
  updateUser,
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateCreateUser, validateUpdateUser } from '../validators/admin.validator.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.post('/users', validateCreateUser, createUser);
router.put('/users/:id', validateUpdateUser, updateUser);
router.patch('/users/:id/archive', archiveUser);
router.patch('/users/:id/restore', restoreUser);

export default router;
