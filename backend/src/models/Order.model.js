// e:\Aquaflow\backend\src\models\Order.model.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ORDER_STATUS, ORDER_PAYMENT_STATUS, PAYMENT_METHOD } from '../constants/order.constants.js';

const orderSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  customer_id: {
    type: String,
    ref: 'Customer',
    required: true,
    index: true,
  },
  assigned_rider_id: {
    type: String,
    ref: 'Rider',
    default: null,
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
    index: true,
  },
  water_quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0,
  },
  payment_method: {
    type: String,
    enum: Object.values(PAYMENT_METHOD),
    required: true,
  },
  payment_status: {
    type: String,
    enum: Object.values(ORDER_PAYMENT_STATUS),
    default: ORDER_PAYMENT_STATUS.UNPAID,
  },
  auto_accepted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: '__v',
  optimisticConcurrency: true,
});

export default mongoose.model('Order', orderSchema);
