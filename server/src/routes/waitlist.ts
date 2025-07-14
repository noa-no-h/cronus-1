import express from 'express';
import { TeamsWaitlist } from '../models/teamsWaitlist';
import { WindowsWaitlist } from '../models/windowsWaitlist';

const router = express.Router();

router.post('/api/windows-waitlist', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await WindowsWaitlist.create({ email });
    return res.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('E11000')) {
      return res.json({ success: true });
    }
    console.error('Windows waitlist error:', error);
    return res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

router.post('/api/teams-waitlist', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await TeamsWaitlist.create({ email });
    return res.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('E11000')) {
      return res.json({ success: true });
    }
    console.error('Teams waitlist error:', error);
    return res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

export default router;
