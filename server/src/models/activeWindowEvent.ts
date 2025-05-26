import mongoose, { Document, Schema } from 'mongoose';
import { ActiveWindowEvent } from '../../../shared/types';

export interface IActiveWindowEvent extends ActiveWindowEvent, Document {}

const activeWindowEventSchema = new Schema({
  userId: { type: String, required: true, index: true },
  windowId: { type: Number, required: true }, // Renamed from id
  ownerName: { type: String, required: true }, // Application name like "Google Chrome", "Visual Studio Code"
  type: { type: String, required: true, enum: ['window', 'browser'] },
  browser: { type: String, enum: ['chrome', 'safari', null] }, // Only if type is 'browser'
  title: { type: String, required: false },
  url: { type: String },
  content: { type: String }, // Optional: content of the window, e.g. for active browser tab
  timestamp: { type: Number, required: true, default: Date.now, index: true }, // Unix timestamp
  screenshotS3Url: { type: String }, // URL of the screenshot stored in S3
});

// Compound index for efficient querying by userId and timestamp
activeWindowEventSchema.index({ userId: 1, timestamp: -1 });

export const ActiveWindowEventModel = mongoose.model<IActiveWindowEvent>(
  'ActiveWindowEvent',
  activeWindowEventSchema
);
