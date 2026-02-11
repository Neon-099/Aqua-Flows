// e:\Aquaflow\backend\src\models\Rider.model.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const riderSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  user_id: {
    type: String,
    ref: 'User',
    required: true,
    index: true,
  },
  vehicle_type: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  maxCapacityGallons: {
    type: Number,
    required: true,
    min: 1,
    default: 43,
  },
  currentLoadGallons: {
    type: Number,
    default: 0,
    min: 0,
  },
  activeOrdersCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: '__v',
  optimisticConcurrency: true,
});

riderSchema.index({ status: 1, currentLoadGallons: 1, activeOrdersCount: 1 });

export default mongoose.model('Rider', riderSchema);
