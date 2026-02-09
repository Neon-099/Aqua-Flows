// e:\Aquaflow\backend\src\models\OrderStatusHistory.model.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ORDER_STATUS } from '../constants/order.constants.js';

const orderStatusHistorySchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  order_id: {
    type: String,
    ref: 'Order',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    required: true,
  },
  changed_by: {
    type: String,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: '__v',
  optimisticConcurrency: true,
});

export default mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
