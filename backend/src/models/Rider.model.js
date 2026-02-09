import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const riderSchema = new mongoose.Schema({
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
    is_available: {
        type: Boolean,
        default: true
    },

}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at'},
    versionKey: '__v',
    optimisticConcurrency: true
})

export default mongoose.model('Rider', riderSchema);