import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { trpc } from '../../utils/trpc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'

const DistractionSoundSettings = () => {
  const { token } = useAuth()
  const [playDistractionSound, setPlayDistractionSound] = useState(true)
  const [distractionSoundInterval, setDistractionSoundInterval] = useState(30) // in seconds
  const [showDistractionNotifications, setShowDistractionNotifications] = useState(true)

  const { data: electronSettings, isLoading } = trpc.user.getElectronAppSettings.useQuery(
    { token: token || '' },
    { enabled: !!token }
  )

  const updateSettingsMutation = trpc.user.updateElectronAppSettings.useMutation({
    onError: (error) => {
      console.error('Failed to update settings:', error)
      alert('Failed to save settings. Your changes might not be saved.')
      // Revert on error to stay in sync with the backend
      if (electronSettings) {
        setPlayDistractionSound(electronSettings.playDistractionSound)
        setDistractionSoundInterval(electronSettings.distractionSoundInterval)
        setShowDistractionNotifications(
          (electronSettings as any).showDistractionNotifications ?? true
        )
      }
    }
  })

  // Load settings when data is fetched
  useEffect(() => {
    if (electronSettings) {
      setPlayDistractionSound(electronSettings.playDistractionSound)
      setDistractionSoundInterval(electronSettings.distractionSoundInterval)
      setShowDistractionNotifications(
        (electronSettings as any).showDistractionNotifications ?? true
      )
    }
  }, [electronSettings])

  const handlePlaySoundChange = (isChecked: boolean) => {
    if (!token) return
    setPlayDistractionSound(isChecked)
    updateSettingsMutation.mutate({
      token,
      playDistractionSound: isChecked,
      distractionSoundInterval,
      showDistractionNotifications
    })
  }

  const handleIntervalChange = (value: string) => {
    if (!token) return
    const interval = Number(value)
    setDistractionSoundInterval(interval)
    updateSettingsMutation.mutate({
      token,
      playDistractionSound,
      distractionSoundInterval: interval,
      showDistractionNotifications
    })
  }

  const handleShowNotificationsChange = (isChecked: boolean) => {
    if (!token) return
    setShowDistractionNotifications(isChecked)
    updateSettingsMutation.mutate({
      token,
      playDistractionSound,
      distractionSoundInterval,
      showDistractionNotifications: isChecked
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Distraction Alert Settings</CardTitle>
        <CardDescription>
          Configure sounds and notifications for when you get distracted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-notifications-switch">Show Distraction Notifications</Label>
          <Switch
            id="show-notifications-switch"
            checked={showDistractionNotifications}
            onCheckedChange={handleShowNotificationsChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="play-sound-switch">Play Distraction Sound</Label>
          <Switch
            id="play-sound-switch"
            checked={playDistractionSound}
            onCheckedChange={handlePlaySoundChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sound-interval-select">Sound Interval</Label>
          <Select
            value={distractionSoundInterval.toString()}
            onValueChange={handleIntervalChange}
            disabled={!playDistractionSound}
          >
            <SelectTrigger id="sound-interval-select" className="w-[180px]">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Every 5 seconds</SelectItem>
              <SelectItem value="10">Every 10 seconds</SelectItem>
              <SelectItem value="30">Every 30 seconds</SelectItem>
              <SelectItem value="60">Every 1 minute</SelectItem>
              <SelectItem value="120">Every 2 minutes</SelectItem>
              <SelectItem value="300">Every 5 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

export default DistractionSoundSettings
