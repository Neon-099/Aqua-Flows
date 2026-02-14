import * as chatService from '../services/chat.service.js';

export const createConversation = async (req, res, next) => {
  try {
    const { receiverId, orderId } = req.body;
    const result = await chatService.getOrCreateConversation({
      senderUser: req.user,
      receiverId,
      orderId: orderId || null,
    });
    res.status(201).json({ success: true, data: result.conversation });
  } catch (err) {
    next(err);
  }
};

export const listConversations = async (req, res, next) => {
  try {
    const includeArchived =
      String(req.query.archived || '').toLowerCase() === 'true' ||
      String(req.query.archived || '') === '1';
    const list = await chatService.listConversationsForUser({
      userId: req.user._id,
      limit: Number(req.query.limit) || 20,
      includeArchived,
    });
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const result = await chatService.getConversationMessages({
      conversationId: req.params.conversationId,
      userId: req.user._id,
      limit: Number(req.query.limit) || 30,
      before: req.query.before,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const postMessage = async (req, res, next) => {
  try {
    const result = await chatService.sendMessage({
      senderUser: req.user,
      conversationId: req.params.conversationId,
      message: req.body.message,
    });
    res.status(201).json({ success: true, data: result.saved });
  } catch (err) {
    next(err);
  }
};

export const markSeen = async (req, res, next) => {
  try {
    const result = await chatService.markConversationSeen({
      conversationId: req.params.conversationId,
      userId: req.user._id,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
