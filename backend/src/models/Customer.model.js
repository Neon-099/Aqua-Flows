// e:\Aquaflow\backend\src\models\Customer.model.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const customerSchema = new mongoose.Schema({
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
  default_address: {
    type: String,
    trim: true,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: '__v',
  optimisticConcurrency: true,
});

export default mongoose.model('Customer', customerSchema);
