import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const participantSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: 'User', required: true },
    role: { type: String, enum: ['customer', 'staff', 'rider', 'admin'], required: true },
    lastReadAt: { type: Date, default: null },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    participants: {
      type: [participantSchema],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length === 2 && v[0].userId !== v[1].userId;
        },
        message: 'Conversation must contain exactly 2 distinct participants',
      },
    },
    participantsHash: { type: String, required: true, index: true },
    orderId: { type: String, ref: 'Order', default: null, index: true },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null, index: true },
    archivedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, versionKey: '__v', optimisticConcurrency: true }
);

conversationSchema.index({ participantsHash: 1, orderId: 1 }, { unique: true });

conversationSchema.pre('validate', function preValidate() {
  if (Array.isArray(this.participants) && this.participants.length === 2) {
    const [a, b] = this.participants.map((p) => String(p.userId)).sort();
    this.participantsHash = `${a}:${b}`;
  }
});

export default mongoose.model('Conversation', conversationSchema);
