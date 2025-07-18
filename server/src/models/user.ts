import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  googleId: string;
  picture?: string;
  createdAt: Date;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  hasCalendarAccess: boolean;
  hasSubscription: boolean;
  stripeCustomerId?: string;
  exportActionUsageCount: number;
  hasCompletedOnboarding: boolean;
  waitlistData?: {
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    companyName?: string;
    workEmail?: string;
    useCase?: string;
    competitorExperience?: string;
    submittedAt?: Date;
  };
  isWaitlisted: boolean;
  tokenVersion: number;
  clientVersion?: string;
  clientVersionLastUpdated?: Date;
  electronAppSettings: {
    calendarZoomLevel: number;
    theme: 'light' | 'dark' | 'system';
    playDistractionSound: boolean;
    distractionSoundInterval: number;
    showDistractionNotifications: boolean;
    distractionNotificationInterval: number;
  };
  userProjectsAndGoals: string;
  multiPurposeApps: string[];
  lastChurnEmailSent?: Date;
}

const userSchema = new Schema({
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
  googleAccessToken: { type: String },
  googleRefreshToken: { type: String },
  hasCalendarAccess: { type: Boolean, default: false },
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
  clientVersion: { type: String },
  clientVersionLastUpdated: { type: Date },
  electronAppSettings: {
    calendarZoomLevel: {
      type: Number,
      default: 60, // Default hour height in pixels
      min: 10,
      max: 200,
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
    distractionNotificationInterval: {
      type: Number,
      default: 60, // in seconds
    },
  },
  userProjectsAndGoals: {
    type: String,
    default: '',
  },
  multiPurposeApps: {
    type: [String],
    default: [],
  },
  lastChurnEmailSent: {
    type: Date,
    required: false,
  },
});

export const UserModel = mongoose.model<IUser>('User', userSchema);
