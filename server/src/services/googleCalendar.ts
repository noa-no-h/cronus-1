import { google } from 'googleapis';
import { UserModel } from '../models/user';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  attendees?: any[];
  conferenceData?: any;
  hangoutLink?: string;
  organizer?: any;
}

export class GoogleCalendarService {
  async getCalendarEvents(
    accessToken: string,
    refreshToken: string,
    startDate: Date,
    endDate: Date,
    userId: string
  ): Promise<CalendarEvent[]> {
    try {
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      auth.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50,
      });

      return (response.data.items || []).map((event) => ({
        id: event.id!,
        summary: event.summary || 'Untitled Meeting',
        start: {
          dateTime: event.start?.dateTime || undefined,
          date: event.start?.date || undefined,
        },
        end: {
          dateTime: event.end?.dateTime || undefined,
          date: event.end?.date || undefined,
        },
        location: event.location || undefined,
        description: event.description || undefined,
        attendees: event.attendees || undefined,
        conferenceData: event.conferenceData || undefined,
        hangoutLink: event.hangoutLink || undefined,
        organizer: event.organizer || undefined,
      }));
    } catch (error: any) {
      console.error('Google Calendar API error:', error);
      if (error.code === 400 && error.message === 'invalid_grant') {
        console.warn(
          'Invalid grant error: User tokens are likely revoked or expired. Invalidating user access.'
        );
        // Invalidate the user's tokens in the database
        await UserModel.findByIdAndUpdate(
          { _id: userId },
          { $set: { googleAccessToken: null, googleRefreshToken: null, hasCalendarAccess: false } }
        );
      }
      return [];
    }
  }
}

export async function getCalendarEvents(userId: string, startDate: Date, endDate: Date) {
  const user = await UserModel.findById(userId)
    .select('googleAccessToken googleRefreshToken')
    .lean();

  if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
    console.error(`User ${userId} does not have Google tokens.`);
    return [];
  }

  const calendarService = new GoogleCalendarService();
  return calendarService.getCalendarEvents(
    user.googleAccessToken,
    user.googleRefreshToken,
    startDate,
    endDate,
    userId
  );
}
