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
  hasCompletedOnboarding: { type: Boolean, default: false },
  // Waitlist form data
  waitlistData: {
    firstName: { type: String },
    lastName: { type: String },
    jobTitle: { type: String },
    companyName: { type: String },
    workEmail: { type: String },
    useCase: { type: String },
    competitorExperience: { type: String },
    submittedAt: { type: Date },
  },
  isWaitlisted: { type: Boolean, default: false },
  tokenVersion: {
    type: Number,
    default: 0,
  },
  electronAppSettings: {
    calendarZoomLevel: {
      type: Number,
      default: 60, // Default hour height in pixels
      min: 40,
      max: 120,
    },
    theme: {
      type: String,
      default: 'system',
      enum: ['light', 'dark', 'system'],
    },
    playDistractionSound: {
      type: Boolean,
      default: true,
    },
    distractionSoundInterval: {
      type: Number,
      default: 30, // in seconds
    },
    showDistractionNotifications: {
      type: Boolean,
      default: true,
    },
  },
  userGoals: {
    weeklyGoal: {
      type: String,
      default: '',
    },
    dailyGoal: {
      type: String,
      default: '',
    },
    lifeGoal: {
      type: String,
      default: '',
    },
  },
});

export const User = mongoose.model('User', userSchema);
