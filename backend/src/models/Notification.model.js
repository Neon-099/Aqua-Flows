import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ORDER_STATUS } from '../constants/order.constants.js';

const NotificationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    customer_id: { type: String, ref: 'Customer', required: true, index: true },
    user_id: { type: String, ref: 'User', required: true, index: true },
    order_id: { type: String, ref: 'Order', required: true, index: true },
    type: { type: String, default: 'order_status', index: true },
    status: { type: String, enum: Object.values(ORDER_STATUS), required: true, index: true },
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
