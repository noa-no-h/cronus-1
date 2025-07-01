import { Document, model, Model, models, Schema } from 'mongoose';

export interface IActivityEventSuggestion extends Document {
  userId: Schema.Types.ObjectId;
  googleCalendarEventId: string;
  startTime: Date;
  endTime: Date;
  name: string;
  suggestedCategoryId?: Schema.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  reasoning?: string;
}

const ActivityEventSuggestionSchema = new Schema<IActivityEventSuggestion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    googleCalendarEventId: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    name: { type: String, required: true },
    suggestedCategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      required: true,
    },
    reasoning: { type: String },
  },
  {
    timestamps: true,
  }
);

ActivityEventSuggestionSchema.index({ userId: 1, googleCalendarEventId: 1 }, { unique: true });

export const ActivityEventSuggestionModel: Model<IActivityEventSuggestion> =
  models.ActivityEventSuggestion || model('ActivityEventSuggestion', ActivityEventSuggestionSchema);
