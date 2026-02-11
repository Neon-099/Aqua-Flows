// e:\Aquaflow\backend\src\models\Order.model.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ORDER_STATUS, ORDER_PAYMENT_STATUS, PAYMENT_METHOD, GALLON_TYPE } from '../constants/order.constants.js';

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
  gallon_type: {
    type: String,
    enum: Object.values(GALLON_TYPE),
    required: true,
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
  dispatch_queued_at: { type: Date, default: null },
  dispatch_after_minutes: { type: Number, default: null },
  dispatch_scheduled_for: { type: Date, default: null },
  dispatched_at: { type: Date, default: null },
  eta_minutes_min: { type: Number, default: null },
  eta_minutes_max: { type: Number, default: null },
  eta_text: { type: String, default: null },
  eta_last_calculated_at: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: '__v',
  optimisticConcurrency: true,
});

export default mongoose.model('Order', orderSchema);
