import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import '../config/env.js';
import User from '../models/User.model.js';
import Customer from '../models/Customer.model.js';
import Rider from '../models/Rider.model.js';
import Staff from '../models/Staff.model.js';
import Admin from '../models/Admin.model.js';
import { USER_ROLE } from '../constants/order.constants.js';

const ensureCustomer = async (user) => {
  const exists = await Customer.findOne({ user_id: user._id });
  if (!exists) {
    await Customer.create({
      user_id: user._id,
      default_address: user.address,
    });
  }
};

const ensureRider = async (user) => {
  const exists = await Rider.findOne({ user_id: user._id });
  if (!exists) {
    await Rider.create({ user_id: user._id });
  }
};

const ensureStaff = async (user) => {
  const exists = await Staff.findOne({ user_id: user._id });
  if (!exists) {
    await Staff.create({ user_id: user._id });
  }
};

const ensureAdmin = async (user) => {
  const exists = await Admin.findOne({ user_id: user._id });
  if (!exists) {
    await Admin.create({ user_id: user._id });
  }
};

const run = async () => {
  await connectDB();

  const users = await User.find({});
  let created = 0;

  for (const user of users) {
    if (user.role === USER_ROLE.CUSTOMER) {
      await ensureCustomer(user);
      created += 1;
    } else if (user.role === USER_ROLE.RIDER) {
      await ensureRider(user);
      created += 1;
    } else if (user.role === USER_ROLE.STAFF) {
      await ensureStaff(user);
      created += 1;
    } else if (user.role === USER_ROLE.ADMIN) {
      await ensureAdmin(user);
      created += 1;
    }
  }

  console.log(`Backfill complete. Checked ${users.length} users.`);
  console.log('Note: This script only creates missing role documents.');

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
