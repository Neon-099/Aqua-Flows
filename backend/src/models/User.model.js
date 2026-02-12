// e:\Aquaflow\backend\src\models\User.model.js
import mongoose from 'mongoose';
import argon2 from 'argon2';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { USER_ROLE } from '../constants/order.constants.js';
import Customer from './Customer.model.js';
import Rider from './Rider.model.js';
import Staff from './Staff.model.js';
import Admin from './Admin.model.js';

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Please select an address option'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    trim: true,
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLE),
    default: USER_ROLE.CUSTOMER,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true, versionKey: '__v', optimisticConcurrency: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await argon2.hash(this.password, { type: argon2.argon2id });
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await argon2.verify(this.password, enteredPassword);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const ensureRoleDocument = async (user) => {
  if (user.role === USER_ROLE.CUSTOMER) {
    await Customer.findOneAndUpdate(
      { user_id: user._id },
      { $setOnInsert: { user_id: user._id, default_address: user.address } },
      { upsert: true }
    );
    return;
  }
  if (user.role === USER_ROLE.RIDER) {
    await Rider.findOneAndUpdate(
      { user_id: user._id },
      { $setOnInsert: { user_id: user._id } },
      { upsert: true }
    );
    return;
  }
  if (user.role === USER_ROLE.STAFF) {
    await Staff.findOneAndUpdate(
      { user_id: user._id },
      { $setOnInsert: { user_id: user._id } },
      { upsert: true }
    );
    return;
  }
  if (user.role === USER_ROLE.ADMIN) {
    await Admin.findOneAndUpdate(
      { user_id: user._id },
      { $setOnInsert: { user_id: user._id } },
      { upsert: true }
    );
  }
};

const cleanupRoleDocuments = async (user, previousRole) => {
  if (!previousRole || previousRole === user.role) return;

  if (user.role === USER_ROLE.CUSTOMER) {
    await Rider.deleteOne({ user_id: user._id });
    await Staff.deleteOne({ user_id: user._id });
    await Admin.deleteOne({ user_id: user._id });
    return;
  }
  if (user.role === USER_ROLE.RIDER) {
    await Customer.deleteOne({ user_id: user._id });
    await Staff.deleteOne({ user_id: user._id });
    await Admin.deleteOne({ user_id: user._id });
    return;
  }
  if (user.role === USER_ROLE.STAFF) {
    await Customer.deleteOne({ user_id: user._id });
    await Rider.deleteOne({ user_id: user._id });
    await Admin.deleteOne({ user_id: user._id });
    return;
  }
  if (user.role === USER_ROLE.ADMIN) {
    await Customer.deleteOne({ user_id: user._id });
    await Rider.deleteOne({ user_id: user._id });
    await Staff.deleteOne({ user_id: user._id });
    return;
  }

  await Customer.deleteOne({ user_id: user._id });
  await Rider.deleteOne({ user_id: user._id });
  await Staff.deleteOne({ user_id: user._id });
  await Admin.deleteOne({ user_id: user._id });
};

userSchema.pre('save', async function () {
  if (!this.isModified('role') || this.isNew) return;
  const existing = await this.constructor.findById(this._id).select('role');
  this.$locals.previousRole = existing?.role;
});

userSchema.post('save', async function (doc) {
  await ensureRoleDocument(doc);
  await cleanupRoleDocuments(doc, doc.$locals?.previousRole);
});

userSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() || {};
  const nextRole = update.role ?? update.$set?.role;
  if (!nextRole) {
    this.$locals.shouldSyncRole = false;
    return;
  }
  this.$locals.shouldSyncRole = true;
  const existing = await this.model.findOne(this.getQuery()).select('role');
  this.$locals.previousRole = existing?.role;
});

userSchema.post('findOneAndUpdate', async function (doc) {
  if (!this.$locals.shouldSyncRole) return;
  let updatedDoc = doc;
  if (!updatedDoc || this.getOptions()?.new === false) {
    updatedDoc = await this.model.findOne(this.getQuery());
  }
  if (!updatedDoc) return;
  await ensureRoleDocument(updatedDoc);
  await cleanupRoleDocuments(updatedDoc, this.$locals.previousRole);
});

export default mongoose.model('User', userSchema);
