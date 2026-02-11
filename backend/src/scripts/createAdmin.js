import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.model.js';
import Admin from '../models/Admin.model.js';
import { USER_ROLE } from '../constants/order.constants.js';
import '../config/env.js';

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const run = async () => {
  await connectDB();

  const email = 'admin@aquaflow.com'
  const password = 'admin1234'
  const name = process.env.ADMIN_NAME || 'AquaFlow Admin';
  const address = process.env.ADMIN_ADDRESS || 'AquaFlow HQ';
  const phone = process.env.ADMIN_PHONE || '000-000-0000';
  const role = USER_ROLE.ADMIN;

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = role;
    existing.name = name;
    existing.address = address;
    existing.phone = phone;
    existing.password = password;
    await existing.save();
    await Admin.findOneAndUpdate(
      { user_id: existing._id },
      { user_id: existing._id },
      { upsert: true }
    );
    console.log(`Admin updated: ${email}`);
  } else {
    const user = await User.create({
      email,
      password,
      name,
      address,
      phone,
      role,
    });
    await Admin.create({ user_id: user._id });
    console.log(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

//npm run seed:admin
