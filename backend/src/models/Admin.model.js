import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const adminSchema = new mongoose.Schema({
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
  level: {
    type: String,
    trim: true,
    default: 'standard',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: '__v',
  optimisticConcurrency: true,
});

adminSchema.index({ status: 1 });

export default mongoose.model('Admin', adminSchema);
