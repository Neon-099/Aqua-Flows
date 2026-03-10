import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ORDER_STATUS } from '../constants/order.constants.js';

const NotificationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    customer_id: {
      type: String,
      ref: 'Customer',
      index: true,
      required: function requiredCustomerId() {
        return this.type === 'order_status';
      },
    },
    user_id: { type: String, ref: 'User', required: true, index: true },
    order_id: {
      type: String,
      ref: 'Order',
      index: true,
      required: function requiredOrderId() {
        return this.type === 'order_status';
      },
    },
    type: {
      type: String,
      enum: ['order_status', 'message'],
      default: 'order_status',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      index: true,
      required: function requiredStatus() {
        return this.type === 'order_status';
      },
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    is_read: { type: Boolean, default: false, index: true },
    read_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: '__v',
    optimisticConcurrency: true,
  }
);

export default mongoose.model('Notification', NotificationSchema);
