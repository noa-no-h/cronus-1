import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

// Use the same MongoDB URI as the electron app
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const TeamsWaitlist =
  mongoose.models.TeamsWaitlist ||
  mongoose.model(
    'TeamsWaitlist',
    new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      companyName: { type: String, required: true },
      teamSize: { type: String, required: true },
      additionalInfo: { type: String, required: false },
      createdAt: { type: Date, default: Date.now },
    })
  );

export async function POST(request: Request) {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(MONGODB_URI as string);
    }
    const { email, companyName, teamSize, additionalInfo } = await request.json();

    await TeamsWaitlist.create({ email, companyName, teamSize, additionalInfo });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    // If email already exists, still return success
    if (error instanceof Error && error.message.includes('E11000')) {
      return NextResponse.json({ success: true });
    }
    console.error('Teams waitlist error:', error);
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
  }
}
