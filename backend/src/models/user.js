import mongoose from 'mongoose';
import argon2 from 'argon2';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  // Ensure we don't accidentally send the password back in JSON responses
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      delete ret.__v;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    // Argon2id is the default type in the argon2 library
    this.password = await argon2.hash(this.password);
  }
});

// Helper method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await argon2.verify(this.password, candidatePassword);
};

export default mongoose.model('User', userSchema);