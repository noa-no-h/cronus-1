import posthog from 'posthog-js'
import { useAuth } from '../../contexts/AuthContext'
import { trpc } from '../../utils/trpc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'

export const DisableUsageAnalyticsSettings = () => {
  const { token, user } = useAuth()
  const utils = trpc.useUtils()

  const { data: electronSettings } = trpc.user.getElectronAppSettings.useQuery(
    {
      token: token || ''
    },
    {
      enabled: !!token
    }
  )

  const updateUserPosthogTrackingMutation = trpc.user.updateUserPosthogTracking.useMutation({
    onSuccess: () => {
      // Use trpc utils for more reliable invalidation
      utils.user.getElectronAppSettings.invalidate({ token: token || '' })
    }
  })

  const handleToggle = async (checked: boolean) => {
    if (token) {
      try {
        await updateUserPosthogTrackingMutation.mutateAsync({
          token,
          optedOutOfPosthogTracking: !checked
        })
        if (!checked) {
          posthog.opt_out_capturing()
        } else {
          posthog.opt_in_capturing()
        }
      } catch (error) {
        console.error('Failed to update PostHog tracking preference:', error)
      }
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-xl">Usage Analytics</CardTitle>
        <CardDescription>
          Help us improve CronusHQ by allowing us to collect anonymous usage data.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center space-x-2">
        <Checkbox
          id="disable-analytics"
          checked={!electronSettings?.optedOutOfPosthogTracking}
          onCheckedChange={handleToggle}
        />
        <Label
          htmlFor="disable-analytics"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Enable Usage Analytics
        </Label>
      </CardContent>
    </Card>
  )
}
