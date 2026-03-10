// backend/src/middlewares/chat.socket.js
import Conversation from '../models/Conversation.model.js';
import { sendPushToUser } from '../services/fcm.service.js';
import { createMessageNotificationForUser } from '../services/notification.service.js';
import * as chatService from '../services/chat.service.js';
import { assertUserInConversation, assertCanJoinOrderRoom } from '../services/chat.authz.service.js';

const roomOfConversation = (id) => `conversation:${id}`;
const roomOfUser = (id) => `user:${id}`;
const roomOfOrder = (id) => `order:${id}`;

// tiny in-memory cache to avoid DB hit on every typing event
const typingAuthCache = new Map();
const TYPING_AUTH_TTL_MS = 20_000;

const getTypingCacheKey = (conversationId, userId) => `${conversationId}:${userId}`;

const getTypingCache = (conversationId, userId) => {
  const key = getTypingCacheKey(conversationId, userId);
  const cached = typingAuthCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    typingAuthCache.delete(key);
    return null;
  }
  return cached;
};

const setTypingCache = (conversationId, userId, archivedAt) => {
  typingAuthCache.set(getTypingCacheKey(conversationId, userId), {
    archivedAt: archivedAt || null,
    expiresAt: Date.now() + TYPING_AUTH_TTL_MS,
  });
};

export const registerChatHandlers = (io, socket) => {
  socket.join(roomOfUser(socket.user._id));

  socket.on('chat:join', async (payload = {}, ack = () => {}) => {
    try {
      const { conversationId } = payload;
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) throw new Error('Conversation not found');

      assertUserInConversation(conversation, socket.user._id);

      await socket.join(roomOfConversation(conversation._id));
      if (conversation.orderId) await socket.join(roomOfOrder(conversation.orderId));

      ack({ ok: true, data: { conversationId: conversation._id } });
    } catch (err) {
      ack({ ok: false, error: err.message });
    }
  });

  socket.on('order:join', async (payload = {}, ack = () => {}) => {
    try {
      const { orderId } = payload;
      await assertCanJoinOrderRoom({ user: socket.user, orderId });
      await socket.join(roomOfOrder(orderId));
      ack({ ok: true, data: { orderId } });
    } catch (err) {
      ack({ ok: false, error: err.message });
    }
  });

  socket.on('chat:typing', async (payload = {}, ack = () => {}) => {
    try {
      const { conversationId, isTyping } = payload;
      if (!conversationId) throw new Error('conversationId is required');

      const cached = getTypingCache(conversationId, socket.user._id);
      if (cached?.archivedAt) throw new Error('Conversation is archived');

      if (!cached) {
        const conversation = await Conversation.findById(conversationId).select('_id participants archivedAt');
        if (!conversation) throw new Error('Conversation not found');
        assertUserInConversation(conversation, socket.user._id);
        setTypingCache(conversationId, socket.user._id, conversation.archivedAt);
        if (conversation.archivedAt) throw new Error('Conversation is archived');
      }

      socket.to(roomOfConversation(conversationId)).emit('chat:typing', {
        conversationId,
        userId: socket.user._id,
        isTyping: Boolean(isTyping),
        timestamp: new Date().toISOString(),
      });

      ack({ ok: true, data: { conversationId } });
    } catch (err) {
      ack({ ok: false, error: err.message });
    }
  });

  socket.on('chat:message', async (payload = {}, ack = () => {}) => {
    try {
      const { conversationId, receiverId, orderId, message } = payload;

      const result = await chatService.sendMessage({
        senderUser: socket.user,
        conversationId,
        receiverId,
        orderId,
        message,
      });

      const eventPayload = {
        _id: result.saved._id,
        conversationId: result.conversation._id,
        senderId: result.saved.senderId,
        receiverId: result.saved.receiverId,
        orderId: result.saved.orderId,
        message: result.saved.message,
        timestamp: result.saved.timestamp ? new Date(result.saved.timestamp).toISOString() : new Date().toISOString(),
        seenAt: result.saved.seenAt ? new Date(result.saved.seenAt).toISOString() : null,
        serverTs: new Date().toISOString(),
      };

      await socket.join(roomOfConversation(result.conversation._id));
      io.to(roomOfConversation(result.conversation._id)).emit('chat:message', eventPayload);

      // Ack immediately after durable write + broadcast
      ack({ ok: true, data: eventPayload });

      // Non-critical notification side effects in background (do not block ack)
      Promise.resolve()
        .then(async () => {
          await createMessageNotificationForUser({
            receiverUser: result.receiverUser,
            senderUser: socket.user,
            conversation: result.conversation,
            message: result.saved.message,
          });

          const sockets = await io.in(roomOfUser(result.receiverUser._id)).fetchSockets();
          if (sockets.length > 0) return;

          await sendPushToUser({
            userId: result.receiverUser._id,
            title: `${socket.user.name}`,
            body: result.saved.message.length > 90
              ? `${result.saved.message.slice(0, 90)}...`
              : result.saved.message,
            data: {
              type: 'chat_message',
              conversationId: result.conversation._id,
              messageId: result.saved._id,
              orderId: result.conversation.orderId || '',
              senderId: socket.user._id,
            },
          });
        })
        .catch((err) => {
          console.error('[chat:message] push task failed:', err?.message || err);
        });
    } catch (err) {
      ack({ ok: false, error: err.message });
    }
  });

  socket.on('chat:seen', async (payload = {}, ack = () => {}) => {
    try {
      const { conversationId } = payload;
      const result = await chatService.markConversationSeen({
        conversationId,
        userId: socket.user._id,
      });

      const out = {
        conversationId,
        userId: socket.user._id,
        seenAt: result.seenAt ? new Date(result.seenAt).toISOString() : new Date().toISOString(),
        serverTs: new Date().toISOString(),
      };

      io.to(roomOfConversation(conversationId)).emit('chat:seen', out);
      ack({ ok: true, data: out });
    } catch (err) {
      ack({ ok: false, error: err.message });
    }
  });

  socket.on('order:update', async (payload = {}, ack = () => {}) => {
    try {
      const { orderId, status, paymentStatus, meta } = payload;
      await assertCanJoinOrderRoom({ user: socket.user, orderId });

      const out = {
        orderId,
        status,
        paymentStatus: paymentStatus || null,
        meta: meta || {},
        updatedBy: socket.user._id,
        timestamp: new Date().toISOString(),
        serverTs: new Date().toISOString(),
      };

      io.to(roomOfOrder(orderId)).emit('order:update', out);
      ack({ ok: true, data: out });
    } catch (err) {
      ack({ ok: false, error: err.message });
    }
  });
};
