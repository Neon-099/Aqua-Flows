import Conversation from '../models/Conversation.model.js';
import { sendPushToUser } from '../services/fcm.service.js';
import * as chatService from '../services/chat.service.js';
import { assertUserInConversation, assertCanJoinOrderRoom } from '../services/chat.authz.service.js';

const roomOfConversation = (id) => `conversation:${id}`;
const roomOfUser = (id) => `user:${id}`;
const roomOfOrder = (id) => `order:${id}`;

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

      ack({ ok: true, conversationId: conversation._id });
    } catch (err) {
      ack({ ok: false, error: err.message });
    }
  });

  socket.on('order:join', async (payload = {}, ack = () => {}) => {
    try {
      const { orderId } = payload;
      await assertCanJoinOrderRoom({ user: socket.user, orderId });
      await socket.join(roomOfOrder(orderId));
      ack({ ok: true, orderId });
    } catch (err) {
      ack({ ok: false, error: err.message });
    }
  });

  socket.on('chat:typing', async (payload = {}, ack = () => {}) => {
    try {
      const { conversationId, isTyping } = payload;
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) throw new Error('Conversation not found');

      assertUserInConversation(conversation, socket.user._id);

      socket.to(roomOfConversation(conversationId)).emit('chat:typing', {
        conversationId,
        userId: socket.user._id,
        isTyping: Boolean(isTyping),
        timestamp: new Date().toISOString(),
      });

      ack({ ok: true });
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
        timestamp: result.saved.timestamp,
        seenAt: result.saved.seenAt,
      };

      await socket.join(roomOfConversation(result.conversation._id));
      io.to(roomOfConversation(result.conversation._id)).emit('chat:message', eventPayload);

      const sockets = await io.in(roomOfUser(result.receiverUser._id)).fetchSockets();
      if (sockets.length === 0) {
        await sendPushToUser({
          userId: result.receiverUser._id,
          title: `${socket.user.name}`,
          body: result.saved.message.length > 90 ? `${result.saved.message.slice(0, 90)}...` : result.saved.message,
          data: {
            type: 'chat_message',
            conversationId: result.conversation._id,
            messageId: result.saved._id,
            orderId: result.conversation.orderId || '',
            senderId: socket.user._id,
          },
        });
      }

      ack({ ok: true, data: eventPayload });
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

      io.to(roomOfConversation(conversationId)).emit('chat:seen', {
        conversationId,
        userId: socket.user._id,
        seenAt: result.seenAt,
      });

      ack({ ok: true, data: result });
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
      };

      io.to(roomOfOrder(orderId)).emit('order:update', out);
      ack({ ok: true, data: out });
    } catch (err) {
      ack({ ok: false, error: err.message });
    }
  });
};
