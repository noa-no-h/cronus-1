import mongoose, { Document } from 'mongoose';

export interface ITeamsWaitlist extends Document {
  email: string;
  companyName: string;
  teamSize: string;
  additionalInfo?: string;
  createdAt: Date;
}

const teamsWaitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  teamSize: {
    type: String,
    required: true,
  },
  additionalInfo: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const TeamsWaitlist: mongoose.Model<ITeamsWaitlist> =
  mongoose.models.TeamsWaitlist ||
  mongoose.model<ITeamsWaitlist>('TeamsWaitlist', teamsWaitlistSchema);
