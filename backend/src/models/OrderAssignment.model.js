// e:\Aquaflow\backend\src\models\OrderAssignment.model.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const orderAssignmentSchema = new mongoose.Schema({
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
  rider_id: {
    type: String,
    ref: 'Rider',
    required: true,
    index: true,
  },
  assigned_by: {
    type: String,
    ref: 'User',
    required: true,
  },
  assigned_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false,
  versionKey: '__v',
  optimisticConcurrency: true,
});

export default mongoose.model('OrderAssignment', orderAssignmentSchema);
