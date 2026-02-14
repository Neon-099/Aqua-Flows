import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const messageSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    conversationId: { type: String, ref: 'Conversation', required: true, index: true },
    senderId: { type: String, ref: 'User', required: true, index: true },
    receiverId: { type: String, ref: 'User', required: true, index: true },
    orderId: { type: String, ref: 'Order', default: null, index: true },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    seenAt: { type: Date, default: null, index: true },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: 'updatedAt' }, versionKey: '__v', optimisticConcurrency: true }
);

messageSchema.index({ conversationId: 1, timestamp: -1 });

export default mongoose.model('Message', messageSchema);
