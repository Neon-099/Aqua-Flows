import Conversation from '../models/Conversation.model.js';
import Message from '../models/Message.model.js';
import Order from '../models/Order.model.js';
import Customer from '../models/Customer.model.js';
import Rider from '../models/Rider.model.js';
import Staff from '../models/Staff.model.js';
import User from '../models/User.model.js';
import {
  assertRolePairAllowed,
  getUserByIdOrFail,
  assertOrderScopeIfProvided,
  assertUserInConversation,
  normalizeChatRole,
} from './chat.authz.service.js';
import { ORDER_STATUS } from '../constants/order.constants.js';

const throwError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

const debugChat = (...args) => {
  if (process.env.NODE_ENV === 'test') return;
  console.log('[chat-debug]', ...args);
};

const ARCHIVE_RETENTION_DAYS = 7;
const FINISHED_ORDER_STATUSES = [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED];

export const getOrCreateConversation = async ({ senderUser, receiverId, orderId = null }) => {
  const receiverUser = await getUserByIdOrFail(receiverId);
  const senderRole = normalizeChatRole(senderUser.role);
  const receiverRole = normalizeChatRole(receiverUser.role);
  assertRolePairAllowed(senderRole, receiverRole);
  await assertOrderScopeIfProvided({ orderId, userA: senderUser, userB: receiverUser });

  const ids = [senderUser._id, receiverUser._id].sort();
  const participantsHash = `${ids[0]}:${ids[1]}`;

  let convo = await Conversation.findOne({ participantsHash, orderId: orderId || null });
  if (!convo) {
    convo = await Conversation.create({
      participants: [
        { userId: senderUser._id, role: senderRole, lastReadAt: new Date() },
        { userId: receiverUser._id, role: receiverRole, lastReadAt: null },
      ],
      orderId: orderId || null,
    });
  }

  return { conversation: convo, receiverUser };
};

export const listConversationsForUser = async ({ userId, limit = 20, includeArchived = false }) => {
  const me = await User.findById(userId);
  debugChat('listConversationsForUser:start', { userId, role: me?.role, limit, includeArchived });
  if (me) {
    try {
      await bootstrapDefaultConversationsForUser(me);
      await archiveFinishedOrderConversations();
      await purgeExpiredArchivedConversations();
      debugChat('bootstrap:done', { userId, role: me.role });
    } catch (_) {
      // Keep conversation listing available even if bootstrap hits stale references.
      debugChat('bootstrap:error', { userId, role: me.role, error: _?.message || 'unknown' });
    }
  }

  const query = { 'participants.userId': userId };
  if (!includeArchived) query.archivedAt = null;

  const rows = await Conversation.find(query)
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(limit);
  debugChat('listConversationsForUser:fetchedRows', { userId, count: rows.length });

  const enriched = await enrichConversationsForUser({ userId, conversations: rows });
  debugChat('listConversationsForUser:enrichedRows', { userId, count: enriched.length });
  return enriched;
};

export const getConversationMessages = async ({ conversationId, userId, limit = 30, before }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throwError(404, 'Conversation not found');
  assertUserInConversation(conversation, userId);

  const filter = { conversationId };
  if (before) filter.timestamp = { $lt: new Date(before) };

  const messages = await Message.find(filter)
    .sort({ timestamp: -1 })
    .limit(Math.min(Number(limit) || 30, 100));

  return { conversation, messages: messages.reverse() };
};

export const sendMessage = async ({ senderUser, conversationId, receiverId, orderId, message }) => {
  if (!message || !String(message).trim()) throwError(400, 'message is required');

  let conversation;
  let receiverUser;

  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (!conversation) throwError(404, 'Conversation not found');
    if (conversation.archivedAt) throwError(410, 'Conversation is archived');
    assertUserInConversation(conversation, senderUser._id);

    const receiver = conversation.participants.find((p) => p.userId !== senderUser._id);
    receiverUser = await getUserByIdOrFail(receiver.userId);
  } else {
    if (!receiverId) throwError(400, 'receiverId is required when conversationId is missing');
    const created = await getOrCreateConversation({
      senderUser,
      receiverId,
      orderId: orderId || null,
    });
    conversation = created.conversation;
    receiverUser = created.receiverUser;
  }

  const saved = await Message.create({
    conversationId: conversation._id,
    senderId: senderUser._id,
    receiverId: receiverUser._id,
    orderId: conversation.orderId || null,
    message: String(message).trim(),
  });

  conversation.lastMessage = saved.message;
  conversation.lastMessageAt = saved.timestamp;
  await conversation.save();

  return { conversation, saved, receiverUser };
};

export const markConversationSeen = async ({ conversationId, userId }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throwError(404, 'Conversation not found');
  assertUserInConversation(conversation, userId);

  const now = new Date();

  await Message.updateMany(
    { conversationId, receiverId: userId, seenAt: null },
    { $set: { seenAt: now } }
  );

  conversation.participants = conversation.participants.map((p) =>
    p.userId === userId ? { ...p.toObject(), lastReadAt: now } : p
  );
  await conversation.save();

  return { conversationId, seenAt: now };
};

const bootstrapDefaultConversationsForUser = async (user) => {
  const role = normalizeChatRole(user.role);
  if (role === 'customer') {
    await ensureCustomerStaffConversation(user);
    await ensureCustomerAssignedRiderConversations(user);
    await ensureRoleDirectoryConversations(user, ['staff', 'rider']);
    return;
  }

  if (role === 'rider') {
    await ensureRiderStaffConversation(user);
    await ensureRiderAssignedCustomerConversations(user);
    await ensureRoleDirectoryConversations(user, ['staff', 'customer', 'user']);
    return;
  }

  if (role === 'staff') {
    await ensureStaffDirectoryConversations(user);
    await ensureRoleDirectoryConversations(user, ['customer', 'user', 'rider']);
  }
};

const ensureCustomerStaffConversation = async (customerUser) => {
  const staffRows = await Staff.find({ status: 'active' }).limit(1);
  const staffRow = staffRows[0] || (await Staff.findOne());
  const staffUser = staffRow
    ? await User.findById(staffRow.user_id)
    : await User.findOne({ role: 'staff' }).select('_id role name');
  if (!staffUser) return;

  await getOrCreateConversation({
    senderUser: customerUser,
    receiverId: staffUser._id,
    orderId: null,
  });
};

const ensureRiderStaffConversation = async (riderUser) => {
  const staffRows = await Staff.find({ status: 'active' }).limit(1);
  const staffRow = staffRows[0] || (await Staff.findOne());
  const staffUser = staffRow
    ? await User.findById(staffRow.user_id)
    : await User.findOne({ role: 'staff' }).select('_id role name');
  if (!staffUser) return;

  await getOrCreateConversation({
    senderUser: riderUser,
    receiverId: staffUser._id,
    orderId: null,
  });
};

const ensureStaffDirectoryConversations = async (staffUser) => {
  const [customerUsers, riderUsers] = await Promise.all([
    User.find({ role: { $in: ['customer', 'user'] } }).select('_id').limit(100),
    User.find({ role: 'rider' }).select('_id').limit(100),
  ]);

  const targets = [
    ...customerUsers.map((u) => u._id),
    ...riderUsers.map((u) => u._id),
  ].filter((id) => id && id !== staffUser._id);

  if (!targets.length) return;

  const tasks = targets.map((receiverId) =>
    getOrCreateConversation({
      senderUser: staffUser,
      receiverId,
      orderId: null,
    })
  );

  await Promise.allSettled(tasks);
};

const ensureRoleDirectoryConversations = async (user, targetRoles = []) => {
  if (!Array.isArray(targetRoles) || targetRoles.length === 0) return;
  const targets = await User.find({ role: { $in: targetRoles } }).select('_id').limit(200);
  debugChat('ensureRoleDirectoryConversations:targets', {
    userId: user._id,
    userRole: user.role,
    targetRoles,
    targetCount: targets.length,
  });
  const tasks = targets
    .map((target) => target?._id)
    .filter((id) => id && id !== user._id)
    .map((receiverId) =>
      getOrCreateConversation({
        senderUser: user,
        receiverId,
        orderId: null,
      })
    );
  if (!tasks.length) return;
  const results = await Promise.allSettled(tasks);
  const createdOrFound = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => r.reason?.message || String(r.reason))
    .slice(0, 5);
  debugChat('ensureRoleDirectoryConversations:results', {
    userId: user._id,
    userRole: user.role,
    createdOrFound,
    failed,
    errors,
  });
};

const archiveFinishedOrderConversations = async () => {
  const finishedOrders = await Order.find({ status: { $in: FINISHED_ORDER_STATUSES } }).select('_id');
  const finishedOrderIds = finishedOrders.map((o) => o._id);
  if (!finishedOrderIds.length) return;

  const result = await Conversation.updateMany(
    {
      archivedAt: null,
      orderId: { $in: finishedOrderIds },
      'participants.role': { $all: ['customer', 'rider'] },
    },
    { $set: { archivedAt: new Date() } }
  );

  if (result?.modifiedCount) {
    debugChat('archiveFinishedOrderConversations:archived', { count: result.modifiedCount });
  }
};

const purgeExpiredArchivedConversations = async () => {
  const cutoff = new Date(Date.now() - ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const expired = await Conversation.find({
    archivedAt: { $lte: cutoff },
    'participants.role': { $all: ['customer', 'rider'] },
  }).select('_id');

  const ids = expired.map((c) => c._id);
  if (!ids.length) return;

  await Message.deleteMany({ conversationId: { $in: ids } });
  await Conversation.deleteMany({ _id: { $in: ids } });
  debugChat('purgeExpiredArchivedConversations:deleted', { count: ids.length });
};

const ensureCustomerAssignedRiderConversations = async (customerUser) => {
  const customer = await Customer.findOne({ user_id: customerUser._id });
  if (!customer) return;

  const orders = await Order.find({
    customer_id: customer._id,
    assigned_rider_id: { $ne: null },
  })
    .select('_id assigned_rider_id')
    .sort({ created_at: -1 })
    .limit(50);

  if (!orders.length) return;

  const riderRows = await Rider.find({
    _id: { $in: orders.map((o) => o.assigned_rider_id).filter(Boolean) },
  }).select('_id user_id');
  const riderUserByRiderId = new Map(riderRows.map((r) => [r._id, r.user_id]));

  const tasks = orders
    .map((order) => {
      const riderUserId = riderUserByRiderId.get(order.assigned_rider_id);
      if (!riderUserId) return null;
      return getOrCreateConversation({
        senderUser: customerUser,
        receiverId: riderUserId,
        orderId: order._id,
      });
    })
    .filter(Boolean);

  await Promise.allSettled(tasks);
};

const ensureRiderAssignedCustomerConversations = async (riderUser) => {
  const rider = await Rider.findOne({ user_id: riderUser._id });
  if (!rider) return;

  const orders = await Order.find({ assigned_rider_id: rider._id })
    .select('_id customer_id')
    .sort({ created_at: -1 })
    .limit(50);

  if (!orders.length) return;

  const customers = await Customer.find({
    _id: { $in: orders.map((o) => o.customer_id).filter(Boolean) },
  }).select('_id user_id');
  const customerUserByCustomerId = new Map(customers.map((c) => [c._id, c.user_id]));

  const tasks = orders
    .map((order) => {
      const customerUserId = customerUserByCustomerId.get(order.customer_id);
      if (!customerUserId) return null;
      return getOrCreateConversation({
        senderUser: riderUser,
        receiverId: customerUserId,
        orderId: order._id,
      });
    })
    .filter(Boolean);

  await Promise.allSettled(tasks);
};

const enrichConversationsForUser = async ({ userId, conversations }) => {
  if (!Array.isArray(conversations) || conversations.length === 0) return [];

  const participantIds = new Set();
  const orderIds = new Set();

  conversations.forEach((row) => {
    row?.participants?.forEach((p) => participantIds.add(p.userId));
    if (row?.orderId) orderIds.add(row.orderId);
  });

  const [users, orders] = await Promise.all([
    User.find({ _id: { $in: Array.from(participantIds) } }).select('_id name role'),
    Order.find({ _id: { $in: Array.from(orderIds) } }).select('_id status assigned_rider_id'),
  ]);

  const userById = new Map(users.map((u) => [u._id, u]));
  const orderById = new Map(orders.map((o) => [o._id, o]));

  const mapped = conversations.map((row) => {
    const lastReadAt =
      row.participants.find((p) => p.userId === userId)?.lastReadAt || null;
    const unreadCount = row.lastMessageAt && (!lastReadAt || row.lastMessageAt > lastReadAt) ? 1 : 0;

    const participants = row.participants.map((p) => {
      const user = userById.get(p.userId);
      return {
        ...p.toObject(),
        role: normalizeChatRole(user?.role || p.role),
        name: user?.name || null,
      };
    });

    const other = participants.find((p) => p.userId !== userId) || participants[0] || null;
    const meRole = normalizeChatRole(userById.get(userId)?.role);
    const otherRole = normalizeChatRole(other?.role);
    if (!isCounterpartyAllowed({ meRole, otherRole })) {
      debugChat('enrich:filteredByRole', {
        userId,
        meRole,
        otherRole,
        conversationId: row._id,
      });
      return null;
    }
    const order = row.orderId ? orderById.get(row.orderId) : null;

    const withMeta = row.toObject();
    withMeta.participants = participants;
    withMeta.unreadCount = unreadCount;
    withMeta.orderStatus = order?.status || null;
    withMeta.isRiderAssigned = Boolean(order?.assigned_rider_id);
    withMeta.counterpartyRole = otherRole;
    withMeta.counterpartyLabel = deriveCounterpartyLabel({ me: userById.get(userId), other, order });
    return withMeta;
  }).filter(Boolean);
  debugChat('enrich:complete', { userId, input: conversations.length, output: mapped.length });
  return mapped;
};

const deriveCounterpartyLabel = ({ me, other, order }) => {
  if (!me || !other) return null;

  const meRole = normalizeChatRole(me.role);
  const otherRole = normalizeChatRole(other.role);

  if (meRole === 'customer' && otherRole === 'staff') return 'Staff Support';
  if (meRole === 'customer' && otherRole === 'rider') {
    return order?.assigned_rider_id ? 'Assigned Rider' : 'Rider';
  }
  if (meRole === 'rider' && otherRole === 'customer') return 'Order Customer';
  if (meRole === 'staff' && otherRole === 'customer') return 'Customer';
  if (meRole === 'staff' && otherRole === 'rider') return 'Rider';
  return null;
};

const isCounterpartyAllowed = ({ meRole, otherRole }) => {
  if (!meRole || !otherRole) return false;
  if (meRole === 'staff') return otherRole === 'customer' || otherRole === 'rider';
  if (meRole === 'customer') return otherRole === 'staff' || otherRole === 'rider';
  if (meRole === 'rider') return otherRole === 'customer' || otherRole === 'staff';
  return false;
};
