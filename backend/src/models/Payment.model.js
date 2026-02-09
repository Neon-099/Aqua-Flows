// e:\Aquaflow\backend\src\models\Payment.model.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { PAYMENT_STATUS, PAYMENT_METHOD, PAYMENT_PROVIDER } from '../constants/order.constants.js';

const paymentSchema = new mongoose.Schema({
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
  provider: {
    type: String,
    enum: Object.values(PAYMENT_PROVIDER),
    default: PAYMENT_PROVIDER.PAYMONGO,
  },
  method: {
    type: String,
    enum: Object.values(PAYMENT_METHOD),
    required: true,
  },
  paymongo_payment_intent_id: String,
  paymongo_source_id: String,
  paymongo_payment_id: String,
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'PHP',
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
    index: true,
  },
  paid_at: Date,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: '__v',
  optimisticConcurrency: true,
});

export default mongoose.model('Payment', paymentSchema);
