import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  createConversation,
  listConversations,
  getMessages,
  postMessage,
  markSeen,
} from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/conversations', protect, createConversation);
router.get('/conversations', protect, listConversations);
router.get('/conversations/:conversationId/messages', protect, getMessages);
router.post('/conversations/:conversationId/messages', protect, postMessage);
router.post('/conversations/:conversationId/seen', protect, markSeen);

export default router;
