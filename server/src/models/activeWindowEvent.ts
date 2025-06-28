import mongoose, { Document, Schema } from 'mongoose';
import { ActiveWindowEvent } from '../../../shared/types';

export interface IActiveWindowEvent extends Omit<ActiveWindowEvent, '_id'>, Document {}

const activeWindowEventSchema = new Schema({
  userId: { type: String, required: true, index: true },
  windowId: { type: Number, required: false }, // Made optional for system events
  ownerName: { type: String, required: true },
  type: { type: String, required: true, enum: ['window', 'browser', 'system', 'manual'] },
  browser: { type: String, enum: ['chrome', 'safari', null] },
  title: { type: String, required: false },
  url: { type: String },
  content: { type: String },
  categoryId: { type: String, required: false, index: true },
  categoryReasoning: { type: String },
  timestamp: { type: Number, required: true, default: Date.now, index: true },
  screenshotS3Url: { type: String },
  durationMs: { type: Number, required: false },
  captureReason: {
    type: String,
    enum: ['app_switch', 'periodic_backup', 'system_sleep', 'system_wake', null],
  },
});

// Compound index for efficient querying by userId and timestamp
activeWindowEventSchema.index({ userId: 1, timestamp: -1 });

export const ActiveWindowEventModel = mongoose.model<IActiveWindowEvent>(
  'ActiveWindowEvent',
  activeWindowEventSchema
);
