
import Rider from '../models/Rider.model.js';
import User from '../models/User.model.js';
import { USER_ROLE } from '../constants/order.constants.js';

const throwError = (status, message) => {
    const err = new Error(message)
    err.statusCode = status
    throw err;
}

export  const createRider = async ({ user, payload}) => {
    if(![USER_ROLE.ADMIN].includes(user.role)){
        throwError(403, 'Only admin can create riders');
    }

    const {user_id, vehicle_type } = payload
    if(!user_id ) throwError (400, 'user_id is required');

    const baseUser = await User.findById(user_id);
  if (!baseUser) throwError(404, 'User not found');

  // ensure role is rider
  if (baseUser.role !== USER_ROLE.RIDER) {
    baseUser.role = USER_ROLE.RIDER;
    await baseUser.save();
  }

  const existing = await Rider.findOne({ user_id });
  if (existing) throwError(400, 'Rider already exists');

  const rider = await Rider.create({
    user_id,
    vehicle_type,
    is_available: true,
  });

  return rider;
};

export const getRiderById = async ({ user, riderId }) => {
  if (![USER_ROLE.ADMIN, USER_ROLE.STAFF, USER_ROLE.RIDER].includes(user.role)) {
    throwError(403, 'Not authorized');
  }
  const rider = await Rider.findById(riderId);
  if (!rider) throwError(404, 'Rider not found');
  return rider;
};

export const listRiders = async ({ user }) => {
  if (![USER_ROLE.ADMIN, USER_ROLE.STAFF].includes(user.role)) {
    throwError(403, 'Not authorized');
  }
  const riders = await Rider.find().sort({ created_at: -1 }).lean();
  const userIds = riders.map((r) => r.user_id);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userById = new Map(users.map((u) => [u._id, u]));

  return riders.map((rider) => ({
    ...rider,
    user: userById.get(rider.user_id) || null,
  }));
};

export const updateRiderAvailability = async ({ user, riderId, is_available }) => {
  if (![USER_ROLE.ADMIN, USER_ROLE.STAFF, USER_ROLE.RIDER].includes(user.role)) {
    throwError(403, 'Not authorized');
  }

  const rider = await Rider.findById(riderId);
  if (!rider) throwError(404, 'Rider not found');

  rider.is_available = Boolean(is_available);
  await rider.save();

  return rider;
};
