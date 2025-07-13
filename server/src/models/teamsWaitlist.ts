import mongoose from 'mongoose';

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

export const TeamsWaitlist = mongoose.model('TeamsWaitlist', teamsWaitlistSchema);
