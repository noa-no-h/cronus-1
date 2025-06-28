import { Calendar, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { trpc } from '../utils/trpc'

export const CalendarIntegrationSettings = () => {
  const { token } = useAuth()
  const [hasCalendarAccess, setHasCalendarAccess] = useState(false)

  const { data: calendarStatus } = trpc.calendar.hasCalendarAccess.useQuery(
    { token: token! },
    { enabled: !!token }
  )

  useEffect(() => {
    if (calendarStatus) {
      setHasCalendarAccess(calendarStatus.hasAccess)
    }
  }, [calendarStatus])

  const handleConnectCalendar = async () => {
    const envVars = await window.api.getEnvVariables()
    const googleClientId = envVars.GOOGLE_CLIENT_ID
    const clientUrl = envVars.CLIENT_URL

    if (!googleClientId || !clientUrl) {
      console.error('Missing OAuth configuration')
      return
    }

    const redirectUri = `${clientUrl}/electron-callback`
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', googleClientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set(
      'scope',
      'openid profile email https://www.googleapis.com/auth/calendar.readonly'
    )
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')

    window.api.openExternalUrl(authUrl.toString())
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Calendar className="w-5 h-5 text-blue-600" />
          Google Calendar Integration
          {hasCalendarAccess && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Connected
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to see scheduled meetings alongside your tracked activity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">📊 What you&apos;ll see:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Meetings in your activity timeline</li>
              <li>• Meeting duration tracking</li>
              <li>• Calendar events treated as activities</li>
            </ul>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">🔒 Privacy:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Read-only calendar access</li>
              <li>• No calendar modifications</li>
              <li>• Data processed securely</li>
            </ul>
          </div>
        </div>

        {!hasCalendarAccess ? (
          <Button onClick={handleConnectCalendar} className="w-full md:w-auto">
            <Calendar className="w-4 h-4 mr-2" />
            Connect Google Calendar
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Calendar connected successfully</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
