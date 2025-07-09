import mongoose from 'mongoose';

const windowsWaitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const WindowsWaitlist = mongoose.model('WindowsWaitlist', windowsWaitlistSchema);
