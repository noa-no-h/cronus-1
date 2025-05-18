import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  picture: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  hasSubscription: { type: Boolean, default: false },
  stripeCustomerId: { type: String },
  exportActionUsageCount: { type: Number, default: 0 },
  // Waitlist form data
  waitlistData: {
    firstName: { type: String },
    lastName: { type: String },
    jobTitle: { type: String },
    companyName: { type: String },
    workEmail: { type: String },
    useCase: { type: String },
    submittedAt: { type: Date },
  },
  isWaitlisted: { type: Boolean, default: false },
  tokenVersion: {
    type: Number,
    default: 0,
  },
});

export const User = mongoose.model('User', userSchema);
