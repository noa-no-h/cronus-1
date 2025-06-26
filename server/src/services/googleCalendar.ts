import { google } from 'googleapis';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  // New fields for Meet info and participants
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    optional?: boolean;
    organizer?: boolean;
  }>;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: 'video' | 'phone' | 'sip' | 'more';
      uri?: string;
      label?: string;
      meetingCode?: string;
    }>;
    conferenceSolution?: {
      name?: string;
      key?: {
        type?: string;
      };
    };
  };
  hangoutLink?: string;
  organizer?: {
    email?: string;
    displayName?: string;
  };
}

export class GoogleCalendarService {
  async getCalendarEvents(
    accessToken: string,
    refreshToken: string,
    startDate: Date,
    endDate: Date
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
        fields:
          'items(id,summary,start,end,location,description,attendees(email,displayName,responseStatus,optional,organizer),conferenceData,hangoutLink,organizer(email,displayName))',
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
    } catch (error) {
      console.error('Google Calendar API error:', error);
      return [];
    }
  }
}
