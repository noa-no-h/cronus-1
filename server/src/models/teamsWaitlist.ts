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

// Check if model already exists to prevent OverwriteModelError in production
let TeamsWaitlist: mongoose.Model<mongoose.Document>;
try {
  TeamsWaitlist = mongoose.model('TeamsWaitlist');
} catch {
  TeamsWaitlist = mongoose.model('TeamsWaitlist', teamsWaitlistSchema);
}

export { TeamsWaitlist };
