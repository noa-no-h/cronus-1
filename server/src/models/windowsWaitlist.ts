import mongoose, { Document } from 'mongoose';

export interface IWindowsWaitlist extends Document {
  email: string;
  createdAt: Date;
}

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

export const WindowsWaitlist: mongoose.Model<IWindowsWaitlist> =
  mongoose.models.WindowsWaitlist ||
  mongoose.model<IWindowsWaitlist>('WindowsWaitlist', windowsWaitlistSchema);
