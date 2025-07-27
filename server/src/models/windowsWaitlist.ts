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

// Check if model already exists to prevent OverwriteModelError in production
let WindowsWaitlist: mongoose.Model<mongoose.Document>;
try {
  WindowsWaitlist = mongoose.model('WindowsWaitlist');
} catch {
  WindowsWaitlist = mongoose.model('WindowsWaitlist', windowsWaitlistSchema);
}

export { WindowsWaitlist };
