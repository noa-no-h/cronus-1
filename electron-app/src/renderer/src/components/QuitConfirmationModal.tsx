import { Monitor, Pause, Settings, X } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface QuitConfirmationModalProps {
  isOpen: boolean
  onQuit: () => void
  onKeepRunning: () => void
  onOpenSettings: () => void
}

export function QuitConfirmationModal({
  isOpen,
  onQuit,
  onKeepRunning,
  onOpenSettings
}: QuitConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9999]" />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <Card className="w-full max-w-md relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onKeepRunning}
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardHeader className="text-center pr-10">
            <CardTitle className="text-xl font-semibold">
              Are you sure you want to close Cronus?
            </CardTitle>
            <CardDescription>
              Your time tracking will continue even when you&apos;re away
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Monitor className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>The app will continue tracking when your computer sleeps or locks</p>
              </div>
              <div className="flex items-start gap-3">
                <Pause className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>You can pause tracking anytime in settings</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={onOpenSettings} variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Open Settings
              </Button>
              <Button onClick={onQuit} variant="default" className="w-full">
                Quit App
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
