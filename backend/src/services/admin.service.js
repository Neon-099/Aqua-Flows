import User from '../models/User.model.js';
import Customer from '../models/Customer.model.js';
import Rider from '../models/Rider.model.js';
import Staff from '../models/Staff.model.js';
import Admin from '../models/Admin.model.js';
import Order from '../models/Order.model.js';
import Payment from '../models/Payment.model.js';
import PaymentEvent from '../models/PaymentEvent.model.js';
import OrderStatusHistory from '../models/OrderStatusHistory.model.js';
import OrderAssignment from '../models/OrderAssignment.model.js';
import AdminActionLog from '../models/AdminActionLog.model.js';
import Conversation from '../models/Conversation.model.js';
import Message from '../models/Message.model.js';
import Notification from '../models/Notification.model.js';
import PushToken from '../models/PushToken.model.js';
import { createCheckoutSession, getCheckoutSession, getPaymentIntent } from './paymongo.service.js';
import { seedDefaultConversationsForUser } from './chat.service.js';
import {
  ORDER_PAYMENT_STATUS,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  USER_ROLE,
} from '../constants/order.constants.js';
import { env } from '../config/env.js';

const allowedRoles = new Set(Object.values(USER_ROLE));
const sortableFields = new Set(['name', 'email', 'role', 'createdAt', 'updatedAt']);

const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return fallback;
};

export const listUsers = async ({
  archived,
  search,
  role,
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const isArchived = normalizeBoolean(archived, false);
  const filter = { isArchived };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (role && role !== 'all' && allowedRoles.has(role)) {
    filter.role = role;
  }

  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

  const order = sortOrder === 'asc' ? 1 : -1;
  const safeSortBy = sortableFields.has(sortBy) ? sortBy : 'createdAt';
  const sort = { [safeSortBy]: order };

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort(sort)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    User.countDocuments(filter),
  ]);

  const customerIds = items.map((item) => item._id);
  const customers = await Customer.find({ user_id: { $in: customerIds } });
  const customerMap = new Map(customers.map((c) => [c.user_id, c]));

  const riderIds = items.filter((item) => item.role === USER_ROLE.RIDER).map((item) => item._id);
  const riders = riderIds.length ? await Rider.find({ user_id: { $in: riderIds } }) : [];
  const riderMap = new Map(riders.map((r) => [r.user_id, r]));

  const hydrated = items.map((user) => {
    const customer = customerMap.get(user._id);
    const rider = riderMap.get(user._id);
    return {
      ...user.toObject(),
      address: customer?.address,
      phone: customer?.phone,
      maxCapacityGallons: rider?.maxCapacityGallons,
    };
  });

  return {
    items: hydrated,
    total,
    page: safePage,
    limit: safeLimit,
    pages: Math.ceil(total / safeLimit) || 1,
  };
};

export const createUser = async (payload) => {
  const startedAt = Date.now();
  const mark = (step) => console.log(`[ADMIN][createUser][step] ${step} ${Date.now() - startedAt}ms`);
  const { address, phone, maxCapacityGallons, ...userPayload } = payload;
  const normalizedEmail = String(userPayload?.email || '').trim().toLowerCase();
  if (normalizedEmail) {
    const existing = await User.findOne({ email: normalizedEmail }).select('_id email role isArchived');
    mark('checked duplicate email');
    if (existing) {
      const err = new Error(
        existing.isArchived
          ? 'Email already exists in an archived user account. Restore or edit that account instead.'
          : 'Email already exists. Please use a different email.'
      );
      err.statusCode = 409;
      throw err;
    }
  }
  userPayload.email = normalizedEmail;
  const user = new User(userPayload);
  user.$locals.skipRoleSync = true;
  await user.save();
  mark('saved user');

  if (user.role === USER_ROLE.CUSTOMER) {
    await Customer.findOneAndUpdate(
      { user_id: user._id },
      {
        $set: { ...(address ? { address } : {}), ...(phone ? { phone } : {}) },
        $setOnInsert: { user_id: user._id },
      },
      { upsert: true }
    );
    mark('synced customer profile');
  } else if (user.role === USER_ROLE.RIDER) {
    if (maxCapacityGallons === undefined) {
      const err = new Error('Max gallon capacity is required for rider accounts');
      err.statusCode = 400;
      throw err;
    }
    const capacity = Number(maxCapacityGallons);
    await Rider.findOneAndUpdate(
      { user_id: user._id },
      { $set: { maxCapacityGallons: capacity }, $setOnInsert: { user_id: user._id } },
      { upsert: true }
    );
    mark('synced rider profile');
  } else if (user.role === USER_ROLE.STAFF) {
    await Staff.findOneAndUpdate(
      { user_id: user._id },
      { $setOnInsert: { user_id: user._id } },
      { upsert: true }
    );
    mark('synced staff profile');
  } else if (user.role === USER_ROLE.ADMIN) {
    await Admin.findOneAndUpdate(
      { user_id: user._id },
      { $setOnInsert: { user_id: user._id } },
      { upsert: true }
    );
    mark('synced admin profile');
  }
  try {
    await seedDefaultConversationsForUser(user);
    mark('seeded default conversations');
  } catch (error) {
    console.error('[chat-seed][admin.createUser] failed', {
      userId: user?._id,
      role: user?.role,
      error: error?.message || String(error),
    });
  }
  mark('done');
  return {
    ...user.toObject(),
    address,
    phone,
    maxCapacityGallons: user.role === USER_ROLE.RIDER ? maxCapacityGallons : undefined,
  };
};

export const updateUser = async (id, payload) => {
  const startedAt = Date.now();
  const mark = (step) => console.log(`[ADMIN][updateUser][step] userId=${id} ${step} ${Date.now() - startedAt}ms`);
  const user = await User.findById(id);
  mark('loaded user');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const previousRole = user.role;

  const { address, phone, maxCapacityGallons, ...rest } = payload;
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined) {
      user[key] = value;
    }
  });

  user.$locals.skipRoleSync = true;
  await user.save();
  mark('saved user');
  // Explicitly sync role profile docs so role changes (e.g., rider -> staff) migrate immediately.
  if (user.role === USER_ROLE.CUSTOMER) {
    await Customer.findOneAndUpdate(
      { user_id: user._id },
      {
        $set: {
          ...(address !== undefined ? { address } : {}),
          ...(phone !== undefined ? { phone } : {}),
        },
        $setOnInsert: { user_id: user._id },
      },
      { upsert: true }
    );
    await Promise.all([
      Rider.deleteOne({ user_id: user._id }),
      Staff.deleteOne({ user_id: user._id }),
      Admin.deleteOne({ user_id: user._id }),
    ]);
    mark('synced customer role profiles');
  } else if (user.role === USER_ROLE.RIDER) {
    const existingRider = await Rider.findOne({ user_id: user._id }).select('maxCapacityGallons');
    const resolvedCapacity =
      maxCapacityGallons !== undefined
        ? Number(maxCapacityGallons)
        : Number(existingRider?.maxCapacityGallons);
    if (!Number.isFinite(resolvedCapacity) || resolvedCapacity < 1) {
      const err = new Error('Max gallon capacity is required when role is rider');
      err.statusCode = 400;
      throw err;
    }
    await Rider.findOneAndUpdate(
      { user_id: user._id },
      { $set: { maxCapacityGallons: resolvedCapacity }, $setOnInsert: { user_id: user._id } },
      { upsert: true }
    );
    await Promise.all([
      Customer.deleteOne({ user_id: user._id }),
      Staff.deleteOne({ user_id: user._id }),
      Admin.deleteOne({ user_id: user._id }),
    ]);
    mark('synced rider role profiles');
  } else if (user.role === USER_ROLE.STAFF) {
    await Staff.findOneAndUpdate(
      { user_id: user._id },
      { $setOnInsert: { user_id: user._id } },
      { upsert: true }
    );
    await Promise.all([
      Customer.deleteOne({ user_id: user._id }),
      Rider.deleteOne({ user_id: user._id }),
      Admin.deleteOne({ user_id: user._id }),
    ]);
    mark('synced staff role profiles');
  } else if (user.role === USER_ROLE.ADMIN) {
    await Admin.findOneAndUpdate(
      { user_id: user._id },
      { $setOnInsert: { user_id: user._id } },
      { upsert: true }
    );
    await Promise.all([
      Customer.deleteOne({ user_id: user._id }),
      Rider.deleteOne({ user_id: user._id }),
      Staff.deleteOne({ user_id: user._id }),
    ]);
    mark('synced admin role profiles');
  }

  const customer = await Customer.findOne({ user_id: user._id });
  const rider = await Rider.findOne({ user_id: user._id });
  const staff = await Staff.findOne({ user_id: user._id });
  const admin = await Admin.findOne({ user_id: user._id });
  mark('loaded role profiles');

  if (previousRole !== user.role) {
    try {
      await seedDefaultConversationsForUser(user);
      mark('seeded default conversations after role change');
    } catch (error) {
      console.error('[chat-seed][admin.updateUser] failed', {
        userId: user?._id,
        previousRole,
        nextRole: user?.role,
        error: error?.message || String(error),
      });
    }
  }

  mark('done');
  return {
    ...user.toObject(),
    address: customer?.address,
    phone: customer?.phone,
    maxCapacityGallons: rider?.maxCapacityGallons,
    roleProfile: user.role === USER_ROLE.STAFF ? staff : user.role === USER_ROLE.ADMIN ? admin : user.role === USER_ROLE.RIDER ? rider : customer,
    roleChangedFrom: previousRole !== user.role ? previousRole : undefined,
  };
};

export const archiveUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  user.isArchived = true;
  await user.save();
  return user;
};

export const restoreUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  user.isArchived = false;
  await user.save();
  return user;
};

export const deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (!user.isArchived) {
    const err = new Error('Only archived users can be permanently deleted');
    err.statusCode = 400;
    throw err;
  }

  const [customer, rider, staff, admin] = await Promise.all([
    Customer.findOne({ user_id: user._id }).select('_id user_id'),
    Rider.findOne({ user_id: user._id }).select('_id user_id'),
    Staff.findOne({ user_id: user._id }).select('_id user_id'),
    Admin.findOne({ user_id: user._id }).select('_id user_id'),
  ]);

  const orderFilter = [];
  if (customer?._id) orderFilter.push({ customer_id: customer._id });
  if (rider?._id) orderFilter.push({ assigned_rider_id: rider._id });

  const orders = orderFilter.length
    ? await Order.find({ $or: orderFilter }).select('_id')
    : [];
  const orderIds = orders.map((row) => row._id);

  const conversationsByUser = await Conversation.find({ 'participants.userId': user._id }).select('_id');
  const conversationsByOrder = orderIds.length
    ? await Conversation.find({ orderId: { $in: orderIds } }).select('_id')
    : [];
  const conversationIds = [
    ...new Set([...conversationsByUser, ...conversationsByOrder].map((row) => row._id)),
  ];

  if (conversationIds.length) {
    await Message.deleteMany({ conversationId: { $in: conversationIds } });
  }
  if (orderIds.length) {
    await Message.deleteMany({ orderId: { $in: orderIds } });
  }
  await Message.deleteMany({ $or: [{ senderId: user._id }, { receiverId: user._id }] });

  if (conversationIds.length) {
    await Conversation.deleteMany({ _id: { $in: conversationIds } });
  }

  if (orderIds.length) {
    const payments = await Payment.find({ order_id: { $in: orderIds } }).select('_id');
    const paymentIds = payments.map((row) => row._id);
    if (paymentIds.length) {
      await PaymentEvent.deleteMany({ payment_id: { $in: paymentIds } });
      await Payment.deleteMany({ _id: { $in: paymentIds } });
    }

    await Promise.all([
      OrderAssignment.deleteMany({ order_id: { $in: orderIds } }),
      OrderStatusHistory.deleteMany({ order_id: { $in: orderIds } }),
      Notification.deleteMany({ order_id: { $in: orderIds } }),
    ]);

    await Order.deleteMany({ _id: { $in: orderIds } });
  }

  await Promise.all([
    OrderAssignment.deleteMany({ assigned_by: user._id }),
    OrderStatusHistory.deleteMany({ changed_by: user._id }),
    Notification.deleteMany({ user_id: user._id }),
    customer?._id ? Notification.deleteMany({ customer_id: customer._id }) : Promise.resolve(),
    PushToken.deleteMany({ userId: user._id }),
    AdminActionLog.deleteMany({
      $or: [{ actor_user_id: user._id }, { target_type: 'user', target_id: user._id }],
    }),
  ]);

  await Promise.all([
    Customer.deleteOne({ user_id: user._id }),
    Rider.deleteOne({ user_id: user._id }),
    Staff.deleteOne({ user_id: user._id }),
    Admin.deleteOne({ user_id: user._id }),
  ]);

  await User.deleteOne({ _id: user._id });

  return { deletedUserId: user._id, deletedOrders: orderIds.length, deletedConversations: conversationIds.length };
};

const parseIntSafe = (value, fallback, min = 1, max = 100) => {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return fallback;
};

const getTimezoneDayRange = (tz, offsetDays = 0) => {
  const now = new Date();
  const tzNow = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  tzNow.setDate(tzNow.getDate() + offsetDays);
  const diff = now.getTime() - tzNow.getTime();

  const startLocal = new Date(tzNow);
  startLocal.setHours(0, 0, 0, 0);

  const endLocal = new Date(tzNow);
  endLocal.setHours(23, 59, 59, 999);

  return {
    start: new Date(startLocal.getTime() + diff),
    end: new Date(endLocal.getTime() + diff),
  };
};

const resolveDateRange = ({ dateScope, dateFrom, dateTo, tz }) => {
  const scope = String(dateScope || 'today').toLowerCase();
  if (scope === 'yesterday') return getTimezoneDayRange(tz, -1);
  if (scope === 'custom' && dateFrom && dateTo) {
    const start = new Date(`${dateFrom}T00:00:00.000Z`);
    const end = new Date(`${dateTo}T23:59:59.999Z`);
    return { start, end };
  }
  return getTimezoneDayRange(tz, 0);
};

const buildFeatureFlags = () => ({
  admin_ops_overview: toBoolean(env.FLAG_ADMIN_OPS_OVERVIEW, true),
  admin_payment_exceptions: toBoolean(env.FLAG_ADMIN_PAYMENT_EXCEPTIONS, true),
  admin_manual_resolution: toBoolean(env.FLAG_ADMIN_MANUAL_RESOLUTION, true),
  customer_retry_payment: toBoolean(env.FLAG_CUSTOMER_RETRY_PAYMENT, true),
  customer_switch_to_cod: toBoolean(env.FLAG_CUSTOMER_SWITCH_TO_COD, true),
});

const recordAdminAction = async ({
  actorUserId,
  action,
  targetType,
  targetId,
  reason,
  before,
  after,
  metadata,
}) => {
  await AdminActionLog.create({
    actor_user_id: actorUserId,
    action,
    target_type: targetType,
    target_id: targetId,
    reason: reason || '',
    before: before || null,
    after: after || null,
    metadata: metadata || null,
  });
};

const hydrateOrders = async (orders) => {
  if (!orders.length) return [];
  const customerIds = [...new Set(orders.map((o) => o.customer_id).filter(Boolean))];
  const riderIds = [...new Set(orders.map((o) => o.assigned_rider_id).filter(Boolean))];

  const [customers, riders] = await Promise.all([
    Customer.find({ _id: { $in: customerIds } }).select('_id user_id phone address'),
    Rider.find({ _id: { $in: riderIds } }).select('_id user_id maxCapacityGallons status'),
  ]);

  const customerById = new Map(customers.map((c) => [c._id, c]));
  const riderById = new Map(riders.map((r) => [r._id, r]));
  const userIds = [
    ...new Set(
      [...customers.map((c) => c.user_id), ...riders.map((r) => r.user_id)].filter(Boolean)
    ),
  ];
  const users = await User.find({ _id: { $in: userIds } }).select('_id name email');
  const userById = new Map(users.map((u) => [u._id, u]));

  return orders.map((order) => {
    const row = order.toObject();
    const customer = customerById.get(row.customer_id);
    const rider = riderById.get(row.assigned_rider_id);
    const customerUser = customer ? userById.get(customer.user_id) : null;
    const riderUser = rider ? userById.get(rider.user_id) : null;
    return {
      ...row,
      customer: customerUser
        ? {
            id: customerUser._id,
            name: customerUser.name,
            email: customerUser.email,
            phone: customer?.phone,
            address: customer?.address,
          }
        : null,
      rider: riderUser
        ? {
            id: riderUser._id,
            name: riderUser.name,
            email: riderUser.email,
            maxCapacityGallons: rider?.maxCapacityGallons,
            status: rider?.status,
          }
        : null,
    };
  });
};

const normalizeProviderStatus = (status) => {
  const value = String(status || '').toLowerCase();
  if (['paid', 'succeeded', 'completed'].includes(value)) return PAYMENT_STATUS.PAID;
  if (['failed', 'cancelled', 'canceled'].includes(value)) return PAYMENT_STATUS.FAILED;
  if (['processing', 'awaiting_next_action'].includes(value)) return PAYMENT_STATUS.PROCESSING;
  return PAYMENT_STATUS.PENDING;
};

export const getFeatureConfig = async () => {
  return {
    timezone: {
      default: env.ADMIN_DASHBOARD_TZ_DEFAULT || 'Asia/Manila',
      alt: env.ADMIN_DASHBOARD_TZ_ALT || 'Asia/Singapore',
    },
    flags: buildFeatureFlags(),
    pendingSlaMinutes: parseIntSafe(env.ADMIN_PENDING_SLA_MINUTES, 30, 5, 240),
  };
};

export const getOverviewToday = async ({ tz, dateScope, dateFrom, dateTo }) => {
  const timezone = tz || env.ADMIN_DASHBOARD_TZ_DEFAULT || 'Asia/Manila';
  const { start, end } = resolveDateRange({
    dateScope,
    dateFrom,
    dateTo,
    tz: timezone,
  });

  const [ordersToday, pendingPayment, completedToday, cancelledToday] = await Promise.all([
    Order.countDocuments({ created_at: { $gte: start, $lte: end } }),
    Order.countDocuments({ status: ORDER_STATUS.PENDING_PAYMENT }),
    OrderStatusHistory.countDocuments({
      status: ORDER_STATUS.COMPLETED,
      created_at: { $gte: start, $lte: end },
    }),
    OrderStatusHistory.countDocuments({
      status: ORDER_STATUS.CANCELLED,
      created_at: { $gte: start, $lte: end },
    }),
  ]);

  const [paidRows, paymentOutcomeRows, trendRows, codFromOrdersRows] = await Promise.all([
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.PAID, paid_at: { $gte: start, $lte: end } } },
      { $group: { _id: '$method', amount: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { updated_at: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    OrderStatusHistory.aggregate([
      {
        $match: {
          status: { $in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED] },
          created_at: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            hour: { $dateToString: { format: '%H', date: '$created_at', timezone } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.hour': 1 } },
    ]),
    Order.aggregate([
      {
        $match: {
          payment_method: PAYMENT_METHOD.COD,
          payment_status: ORDER_PAYMENT_STATUS.PAID,
          updated_at: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, amount: { $sum: '$total_amount' } } },
    ]),
  ]);

  const paidMap = new Map(paidRows.map((r) => [r._id, r.amount]));
  const outcomeMap = new Map(paymentOutcomeRows.map((r) => [r._id, r.count]));
  const codFromPayments = Number(paidMap.get(PAYMENT_METHOD.COD) || 0);
  const codFromOrders = Number(codFromOrdersRows?.[0]?.amount || 0);
  const codPaidAmountToday = codFromPayments > 0 ? codFromPayments : codFromOrders;

  return {
    timezone,
    range: { start, end },
    flags: buildFeatureFlags(),
    kpis: {
      ordersToday,
      completedToday,
      cancelledToday,
      pendingPayment,
      gcashPaidAmountToday: Number(paidMap.get(PAYMENT_METHOD.GCASH) || 0),
      codPaidAmountToday,
      paymentSuccessCount: Number(outcomeMap.get(PAYMENT_STATUS.PAID) || 0),
      paymentFailureCount: Number(outcomeMap.get(PAYMENT_STATUS.FAILED) || 0),
    },
    hourlyTrend: trendRows.map((row) => ({
      hour: row._id.hour,
      status: row._id.status,
      count: row.count,
    })),
  };
};

export const listAdminOrders = async (query) => {
  const timezone = query?.tz || env.ADMIN_DASHBOARD_TZ_DEFAULT || 'Asia/Manila';
  const { start, end } = resolveDateRange({
    dateScope: query?.dateScope,
    dateFrom: query?.dateFrom,
    dateTo: query?.dateTo,
    tz: timezone,
  });

  const page = parseIntSafe(query?.page, 1, 1, 99999);
  const limit = parseIntSafe(query?.limit, 20, 1, 100);
  const sortOrder = String(query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  const sortBy = ['created_at', 'updated_at', 'total_amount', 'status'].includes(query?.sortBy)
    ? query.sortBy
    : 'created_at';

  const filter = {
    created_at: { $gte: start, $lte: end },
  };
  if (query?.status && query.status !== 'all') filter.status = query.status;
  if (query?.paymentMethod && query.paymentMethod !== 'all') filter.payment_method = query.paymentMethod;
  if (query?.paymentStatus && query.paymentStatus !== 'all') filter.payment_status = query.paymentStatus;
  if (query?.riderId) filter.assigned_rider_id = query.riderId;

  if (query?.search) {
    const safe = String(query.search).trim();
    filter.$or = [{ order_code: { $regex: safe, $options: 'i' } }, { _id: safe }];
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const hydrated = await hydrateOrders(items);
  return {
    items: hydrated,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
    timezone,
    range: { start, end },
  };
};

export const listAdminPayments = async (query) => {
  const timezone = query?.tz || env.ADMIN_DASHBOARD_TZ_DEFAULT || 'Asia/Manila';
  const { start, end } = resolveDateRange({
    dateScope: query?.dateScope,
    dateFrom: query?.dateFrom,
    dateTo: query?.dateTo,
    tz: timezone,
  });
  const page = parseIntSafe(query?.page, 1, 1, 99999);
  const limit = parseIntSafe(query?.limit, 20, 1, 100);
  const sortOrder = String(query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  const sortBy = ['created_at', 'updated_at', 'amount', 'paid_at', 'status'].includes(query?.sortBy)
    ? query.sortBy
    : 'created_at';

  const filter = { created_at: { $gte: start, $lte: end } };
  if (query?.status && query.status !== 'all') filter.status = query.status;
  if (query?.method && query.method !== 'all') filter.method = query.method;

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  const orderIds = [...new Set(items.map((p) => p.order_id).filter(Boolean))];
  const orders = await Order.find({ _id: { $in: orderIds } }).select(
    '_id order_code customer_id payment_status payment_method status'
  );
  const orderById = new Map(orders.map((o) => [o._id, o]));
  const hydratedOrders = await hydrateOrders(orders);
  const hydratedByOrderId = new Map(hydratedOrders.map((o) => [o._id, o]));

  return {
    items: items.map((payment) => {
      const row = payment.toObject();
      const order = orderById.get(row.order_id);
      const detailedOrder = hydratedByOrderId.get(row.order_id);
      return {
        ...row,
        order: order
          ? {
              id: order._id,
              orderCode: order.order_code,
              status: order.status,
              paymentStatus: order.payment_status,
              paymentMethod: order.payment_method,
              customer: detailedOrder?.customer || null,
            }
          : null,
      };
    }),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
    timezone,
    range: { start, end },
  };
};

export const listAdminExceptions = async (query) => {
  const slaMinutes = parseIntSafe(env.ADMIN_PENDING_SLA_MINUTES, 30, 5, 240);
  const cutoff = new Date(Date.now() - slaMinutes * 60 * 1000);
  const payments = await Payment.find({
    $or: [
      { status: PAYMENT_STATUS.FAILED },
      { status: PAYMENT_STATUS.PENDING, created_at: { $lte: cutoff } },
      { status: PAYMENT_STATUS.PROCESSING, created_at: { $lte: cutoff } },
    ],
  })
    .sort({ updated_at: -1 })
    .limit(parseIntSafe(query?.limit, 100, 1, 300));

  const orderIds = [...new Set(payments.map((p) => p.order_id).filter(Boolean))];
  const orders = await Order.find({ _id: { $in: orderIds } });
  const orderById = new Map(orders.map((o) => [o._id, o]));
  const hydratedOrders = await hydrateOrders(orders);
  const hydratedByOrderId = new Map(hydratedOrders.map((o) => [o._id, o]));

  const items = payments.map((payment) => {
    const order = orderById.get(payment.order_id);
    const detailedOrder = hydratedByOrderId.get(payment.order_id);
    let type = 'UNKNOWN';
    if (payment.status === PAYMENT_STATUS.FAILED) type = 'FAILED';
    if (
      [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING].includes(payment.status) &&
      payment.created_at <= cutoff
    ) {
      type = 'STALE_PENDING';
    }
    if (
      order &&
      ((payment.status === PAYMENT_STATUS.PAID && order.payment_status !== ORDER_PAYMENT_STATUS.PAID) ||
        (payment.status !== PAYMENT_STATUS.PAID && order.payment_status === ORDER_PAYMENT_STATUS.PAID))
    ) {
      type = 'MISMATCH';
    }

    return {
      type,
      payment: payment.toObject(),
      order: detailedOrder || (order ? order.toObject() : null),
    };
  });

  return {
    items,
    total: items.length,
    slaMinutes,
    flags: buildFeatureFlags(),
  };
};

export const recheckAdminPayment = async ({ id, actorUserId, reason }) => {
  const payment = await Payment.findById(id);
  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }
  const order = await Order.findById(payment.order_id);
  const before = {
    payment: payment.toObject(),
    order: order ? order.toObject() : null,
  };

  let provider;
  const externalId = payment.paymongo_payment_intent_id || payment.paymongo_source_id;
  if (!externalId) {
    const err = new Error('Payment has no provider reference');
    err.statusCode = 400;
    throw err;
  }

  provider = externalId.startsWith('cs_')
    ? await getCheckoutSession({ checkoutSessionId: externalId })
    : await getPaymentIntent({ paymentIntentId: externalId });

  const normalized = normalizeProviderStatus(provider?.status);
  payment.status = normalized;
  if (normalized === PAYMENT_STATUS.PAID && !payment.paid_at) payment.paid_at = new Date();
  await payment.save();

  if (order) {
    if (normalized === PAYMENT_STATUS.PAID) {
      order.payment_status = ORDER_PAYMENT_STATUS.PAID;
      if ([ORDER_STATUS.DELIVERED, ORDER_STATUS.PENDING_PAYMENT].includes(order.status)) {
        order.status = ORDER_STATUS.COMPLETED;
        await OrderStatusHistory.create({
          order_id: order._id,
          status: ORDER_STATUS.COMPLETED,
          changed_by: actorUserId,
        });
      }
    } else if (normalized === PAYMENT_STATUS.FAILED) {
      order.payment_status = ORDER_PAYMENT_STATUS.FAILED;
    } else {
      order.payment_status = ORDER_PAYMENT_STATUS.PENDING;
    }
    await order.save();
  }

  await PaymentEvent.create({
    payment_id: payment._id,
    event_type: 'admin.recheck',
    payload: provider || {},
    received_at: new Date(),
  });

  await recordAdminAction({
    actorUserId,
    action: 'PAYMENT_RECHECK',
    targetType: 'payment',
    targetId: payment._id,
    reason,
    before,
    after: {
      payment: payment.toObject(),
      order: order ? order.toObject() : null,
    },
    metadata: { provider },
  });

  return { payment, order, provider };
};

export const resolveAdminPayment = async ({ id, actorUserId, action, reason }) => {
  const payment = await Payment.findById(id);
  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }
  const order = await Order.findById(payment.order_id);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  const normalizedAction = String(action || 'MARK_FAILED').toUpperCase();
  const before = {
    payment: payment.toObject(),
    order: order.toObject(),
  };
  let metadata = {};

  if (normalizedAction === 'MARK_PAID') {
    payment.status = PAYMENT_STATUS.PAID;
    payment.paid_at = payment.paid_at || new Date();
    order.payment_status = ORDER_PAYMENT_STATUS.PAID;
    if ([ORDER_STATUS.DELIVERED, ORDER_STATUS.PENDING_PAYMENT].includes(order.status)) {
      order.status = ORDER_STATUS.COMPLETED;
      await OrderStatusHistory.create({
        order_id: order._id,
        status: ORDER_STATUS.COMPLETED,
        changed_by: actorUserId,
      });
    }
  } else if (normalizedAction === 'CONVERT_TO_COD') {
    order.payment_method = PAYMENT_METHOD.COD;
    order.payment_status = ORDER_PAYMENT_STATUS.UNPAID;
    if (order.status === ORDER_STATUS.DELIVERED) {
      order.status = ORDER_STATUS.PENDING_PAYMENT;
      await OrderStatusHistory.create({
        order_id: order._id,
        status: ORDER_STATUS.PENDING_PAYMENT,
        changed_by: actorUserId,
      });
    }
    payment.status = PAYMENT_STATUS.FAILED;
  } else if (normalizedAction === 'RESEND_LINK') {
    const successBase = env.CLIENT_URL || 'http://localhost:5173';
    const cancelBase = env.CLIENT_URL || 'http://localhost:5173';
    const session = await createCheckoutSession({
      amount: Number(order.total_amount),
      currency: 'PHP',
      description: `AquaFlow order ${order.order_code || order._id}`,
      successUrl: `${successBase}/orders?gcash=success`,
      cancelUrl: `${cancelBase}/orders?gcash=cancelled`,
      paymentMethodType: 'gcash',
    });
    payment.status = PAYMENT_STATUS.PENDING;
    payment.paymongo_payment_intent_id = session.id;
    order.payment_method = PAYMENT_METHOD.GCASH;
    order.payment_status = ORDER_PAYMENT_STATUS.PENDING;
    order.status = ORDER_STATUS.PENDING_PAYMENT;
    metadata = { checkout_url: session.checkout_url, payment_intent_id: session.id };
  } else {
    payment.status = PAYMENT_STATUS.FAILED;
    order.payment_status = ORDER_PAYMENT_STATUS.FAILED;
  }

  await Promise.all([payment.save(), order.save()]);

  await recordAdminAction({
    actorUserId,
    action: `PAYMENT_RESOLVE_${normalizedAction}`,
    targetType: 'payment',
    targetId: payment._id,
    reason,
    before,
    after: {
      payment: payment.toObject(),
      order: order.toObject(),
    },
    metadata,
  });

  return {
    payment,
    order,
    ...metadata,
  };
};

export const cancelAdminOrder = async ({ id, actorUserId, reason }) => {
  const order = await Order.findById(id);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }
  if (order.status === ORDER_STATUS.CANCELLED) {
    const err = new Error('Order is already cancelled');
    err.statusCode = 400;
    throw err;
  }
  if (order.status === ORDER_STATUS.COMPLETED) {
    const err = new Error('Completed order cannot be cancelled');
    err.statusCode = 400;
    throw err;
  }

  const before = order.toObject();
  order.status = ORDER_STATUS.CANCELLED;
  await order.save();
  await OrderStatusHistory.create({
    order_id: order._id,
    status: ORDER_STATUS.CANCELLED,
    changed_by: actorUserId,
  });

  await recordAdminAction({
    actorUserId,
    action: 'ORDER_CANCEL_OVERRIDE',
    targetType: 'order',
    targetId: order._id,
    reason,
    before,
    after: order.toObject(),
  });

  return order;
};

export const reopenAdminOrder = async ({ id, actorUserId, reason }) => {
  const order = await Order.findById(id);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }
  if (order.status !== ORDER_STATUS.CANCELLED) {
    const err = new Error('Only cancelled orders can be reopened');
    err.statusCode = 400;
    throw err;
  }

  const before = order.toObject();
  order.status = ORDER_STATUS.PENDING;
  await order.save();
  await OrderStatusHistory.create({
    order_id: order._id,
    status: ORDER_STATUS.PENDING,
    changed_by: actorUserId,
  });

  await recordAdminAction({
    actorUserId,
    action: 'ORDER_REOPEN',
    targetType: 'order',
    targetId: order._id,
    reason,
    before,
    after: order.toObject(),
  });

  return order;
};
