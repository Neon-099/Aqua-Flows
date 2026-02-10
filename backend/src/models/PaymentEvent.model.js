// e:\Aquaflow\backend\src\models\PaymentEvent.model.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const paymentEventSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  payment_id: {
    type: String,
    ref: 'Payment',
    required: true,
    index: true,
  },
  event_type: {
    type: String,
    required: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  received_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false,
  versionKey: '__v',
  optimisticConcurrency: true,
});

export default mongoose.model('PaymentEvent', paymentEventSchema);
