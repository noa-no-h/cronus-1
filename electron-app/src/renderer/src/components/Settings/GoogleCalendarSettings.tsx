import { ExternalLink } from 'lucide-react'
import { JSX, useState } from 'react'
import googleCalendarIcon from '../../assets/icons/googlecal.png'
import { useAuth } from '../../contexts/AuthContext'
import { trpc } from '../../utils/trpc'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

export function GoogleCalendarSettings(): JSX.Element {
  const { token } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)

  // Check if user has calendar access
  const { data: calendarStatus, refetch: refetchCalendarStatus } =
    trpc.calendar.hasCalendarAccess.useQuery({ token: token! }, { enabled: !!token })

  const handleConnectCalendar = async (): Promise<void> => {
    setIsConnecting(true)
    try {
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
        'openid email profile https://www.googleapis.com/auth/calendar.readonly'
      )
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')

      window.api.openExternalUrl(authUrl.toString())

      // Set up a listener to refetch calendar status after auth
      const checkAuthResult = setInterval(async () => {
        try {
          await refetchCalendarStatus()
          const newStatus = await refetchCalendarStatus()
          if (newStatus.data?.hasAccess) {
            clearInterval(checkAuthResult)
            setIsConnecting(false)
          }
        } catch (error) {
          console.error('Failed to check calendar status:', error)
        }
      }, 5000) // Check every 5 seconds (balanced between responsiveness and CPU efficiency)

      // Clear interval after 30 seconds to avoid infinite checking
      setTimeout(() => {
        clearInterval(checkAuthResult)
        setIsConnecting(false)
      }, 30000)
    } catch (error) {
      console.error('Failed to open calendar auth:', error)
      setIsConnecting(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img src={googleCalendarIcon} alt="Google Calendar" className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to see your events alongside your activities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {!calendarStatus?.hasAccess && (
            <Button
              onClick={handleConnectCalendar}
              disabled={isConnecting}
              size="sm"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {isConnecting ? 'Connecting...' : 'Connect Calendar'}
            </Button>
          )}
        </div>

        {calendarStatus?.hasAccess && (
          <p className="text-sm text-muted-foreground">
            ✅ Your Google Calendar is connected. Events will appear in your calendar view.
          </p>
        )}

        {!calendarStatus?.hasAccess && (
          <p className="text-sm text-muted-foreground">
            Connect your Google Calendar to see your scheduled events alongside your tracked
            activities.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
