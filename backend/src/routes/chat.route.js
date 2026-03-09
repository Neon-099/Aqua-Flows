import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  createConversation,
  listConversations,
  getMessages,
  postMessage,
  markSeen,
  deleteConversation,
  deleteMessage,
} from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/conversations', protect, createConversation);
router.get('/conversations', protect, listConversations);
router.get('/conversations/:conversationId/messages', protect, getMessages);
router.post('/conversations/:conversationId/messages', protect, postMessage);
router.post('/conversations/:conversationId/seen', protect, markSeen);
router.delete('/conversations/:conversationId', protect, deleteConversation);
router.delete('/conversations/:conversationId/messages/:messageId', protect, deleteMessage);

export default router;
