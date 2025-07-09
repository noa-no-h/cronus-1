import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Use the same MongoDB URI as the electron app
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const WindowsWaitlist =
  mongoose.models.WindowsWaitlist ||
  mongoose.model(
    'WindowsWaitlist',
    new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      createdAt: { type: Date, default: Date.now },
    })
  );

export async function POST(request: Request) {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(MONGODB_URI as string);
    }
    const { email } = await request.json();

    await WindowsWaitlist.create({ email });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    // If email already exists, still return success
    if (error instanceof Error && error.message.includes('E11000')) {
      return NextResponse.json({ success: true });
    }
    console.error('Waitlist error:', error);
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
  }
}
