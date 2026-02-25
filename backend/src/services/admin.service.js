import User from '../models/User.model.js';
import Customer from '../models/Customer.model.js';
import Rider from '../models/Rider.model.js';
import Staff from '../models/Staff.model.js';
import Admin from '../models/Admin.model.js';
import { USER_ROLE } from '../constants/order.constants.js';

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
  const { address, phone, maxCapacityGallons, ...userPayload } = payload;
  const user = await User.create(userPayload);
  if (user.role === USER_ROLE.CUSTOMER && (address || phone)) {
    await Customer.findOneAndUpdate(
      { user_id: user._id },
      { $set: { ...(address ? { address } : {}), ...(phone ? { phone } : {}) }, $setOnInsert: { user_id: user._id } },
      { upsert: true }
    );
  }
  if (user.role === USER_ROLE.RIDER && maxCapacityGallons !== undefined) {
    const capacity = Number(maxCapacityGallons);
    await Rider.findOneAndUpdate(
      { user_id: user._id },
      { $set: { maxCapacityGallons: capacity }, $setOnInsert: { user_id: user._id } },
      { upsert: true }
    );
  }
  return {
    ...user.toObject(),
    address,
    phone,
    maxCapacityGallons: user.role === USER_ROLE.RIDER ? maxCapacityGallons : undefined,
  };
};

export const updateUser = async (id, payload) => {
  const user = await User.findById(id);
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

  await user.save();

  if (user.role === USER_ROLE.CUSTOMER && (address !== undefined || phone !== undefined)) {
    await Customer.findOneAndUpdate(
      { user_id: user._id },
      { $set: { ...(address !== undefined ? { address } : {}), ...(phone !== undefined ? { phone } : {}) } },
      { upsert: true }
    );
  }
  if (user.role === USER_ROLE.RIDER && maxCapacityGallons !== undefined) {
    const capacity = Number(maxCapacityGallons);
    await Rider.findOneAndUpdate(
      { user_id: user._id },
      { $set: { maxCapacityGallons: capacity }, $setOnInsert: { user_id: user._id } },
      { upsert: true }
    );
  }

  const customer = await Customer.findOne({ user_id: user._id });
  const rider = await Rider.findOne({ user_id: user._id });

  return {
    ...user.toObject(),
    address: customer?.address,
    phone: customer?.phone,
    maxCapacityGallons: rider?.maxCapacityGallons,
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
