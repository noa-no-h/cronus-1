import mongoose, { Document, Schema, Types } from 'mongoose';
import { Category as SharedCategory } from '../../../shared/types'; // Alias for clarity

// Interface for the Mongoose document, reflecting stored types
export interface ICategoryDoc extends Document {
  _id: Types.ObjectId; // Explicitly define _id as Mongoose uses it
  userId: Types.ObjectId; // Stored as ObjectId for ref
  name: SharedCategory['name'];
  description?: SharedCategory['description'];
  color: SharedCategory['color'];
  emoji?: SharedCategory['emoji'];
  isProductive: SharedCategory['isProductive'];
  isDefault: SharedCategory['isDefault'];
  isArchived: boolean;
  createdAt: Date; // from timestamps
  updatedAt: Date; // from timestamps
}

export const categorySchema: Schema = new Schema<ICategoryDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Matches ICategoryDoc.userId
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    color: {
      type: String,
      required: true,
      trim: true,
      default: '#FFFFFF',
      validate: {
        validator: function (v: string) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: (props: any) => `${props.value} is not a valid hex color!`,
      },
    },
    emoji: { type: String, trim: true, maxlength: 10 },
    isProductive: { type: Boolean, required: true, default: true },
    isDefault: { type: Boolean, required: true, default: false },
    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc: ICategoryDoc, ret: any) {
        ret._id = doc._id.toString();
        ret.userId = doc.userId.toString();
        delete (ret as any).__v; // Remove version key
        delete (ret as any).id; // Remove Mongoose's default virtual 'id' if it appears
        return ret;
      },
    },
    toObject: {
      transform: function (doc: ICategoryDoc, ret: any) {
        ret._id = doc._id.toString();
        ret.userId = doc.userId.toString();
        delete (ret as any).__v;
        delete (ret as any).id;
        return ret;
      },
    },
  }
);

// Index for unique category name per user
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

// Check if model already exists to prevent OverwriteModelError in production
let CategoryModel: mongoose.Model<ICategoryDoc>;
try {
  CategoryModel = mongoose.model<ICategoryDoc>('Category');
} catch {
  CategoryModel = mongoose.model<ICategoryDoc>('Category', categorySchema);
}

export { CategoryModel };
