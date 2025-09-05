import mongoose, { Document, Schema } from 'mongoose';

export interface ICanonicalBlock extends  Document {
  userId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  appName: string;
  windowTitle: string;
  activityType: 'work' | 'break' | 'unproductive' | 'neutral';
  sourceEventIds: string[];
}
// export type ICanonicalBlock = z.infer<typeof CanonicalBlockSchema>;

const canonicalBlockMongooseSchema = new Schema<ICanonicalBlock>({
  userId: { type: String, required: true, index: true },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  appName: { type: String, required: true },
  windowTitle: { type: String, required: true },
  activityType: { type: String, required: true,  enum: ['work', 'break', 'unproductive', 'neutral']},
  sourceEventIds: [{ type: String }],
}, { timestamps: true });


// Check if model already exists to prevent OverwriteModelError in production
let CanonicalBlockModel: mongoose.Model<ICanonicalBlock & Document>;
try {
  CanonicalBlockModel = mongoose.model<ICanonicalBlock & Document>('CanonicalBlock');
} catch {
  CanonicalBlockModel = mongoose.model<ICanonicalBlock & Document>(
    'CanonicalBlock',
    canonicalBlockMongooseSchema
  );
}

export { CanonicalBlockModel };


