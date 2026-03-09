import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const adminActionLogSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    actor_user_id: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    target_type: {
      type: String,
      required: true,
      index: true,
    },
    target_id: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: '__v',
    optimisticConcurrency: true,
  }
);

adminActionLogSchema.index({ target_type: 1, target_id: 1, created_at: -1 });

export default mongoose.model('AdminActionLog', adminActionLogSchema);
