import React, { useState } from 'react'
import { Pause, Play, Clock, Monitor, Shield, Info } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'

interface PauseTrackingSettingsProps {
  isTrackingPaused: boolean
  onToggleTracking: () => void
}

const PauseTrackingSettings: React.FC<PauseTrackingSettingsProps> = ({
  isTrackingPaused,
  onToggleTracking
}) => {
  const [showPauseModal, setShowPauseModal] = useState(false)

  const handlePauseClick = () => {
    const hasPausedBefore = localStorage.getItem('cronus-has-paused-before')
    console.log(
      'Pause clicked, hasPausedBefore:',
      hasPausedBefore,
      'isTrackingPaused:',
      isTrackingPaused
    )

    if (!hasPausedBefore && !isTrackingPaused) {
      console.log('Showing modal!')
      setShowPauseModal(true)
    } else {
      console.log('Directly toggling tracking')
      onToggleTracking()
    }
  }

  const handlePauseConfirm = () => {
    localStorage.setItem('cronus-has-paused-before', 'true')
    setShowPauseModal(false)
    onToggleTracking()
  }

  const handlePauseCancel = () => {
    setShowPauseModal(false)
  }

  return (
    <>
      <div className="bg-muted/30 rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Pause className="w-5 h-5" />
          Pause Tracking
        </h2>

        <div className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-sm mb-1">Info</h3>
                <p className="text-xs text-muted-foreground">
                  Cronus tracks your activity 24/7 when your computer and the app are running,
                  including when your screen is locked or computer is sleeping. Use pause when you
                  want to take a break from tracking for free time or personal activities.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handlePauseClick} variant={isTrackingPaused ? 'default' : 'outline'}>
            {isTrackingPaused ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume Tracking
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Tracking
              </>
            )}
          </Button>
        </div>
      </div>

      <Dialog open={showPauseModal} onOpenChange={setShowPauseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="w-5 h-5 text-blue-500" />
              Pause Tracking
            </DialogTitle>
            <DialogDescription className="text-left space-y-4">
              <p>
                Cronus tracks your activity when your computer is on, even when the screen is locked
                or you&apos;re away.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Continuous Tracking</p>
                    <p className="text-xs text-muted-foreground">
                      Cronus tracks your activity 24/7 when your computer is running
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Monitor className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Screen Lock & Sleep</p>
                    <p className="text-xs text-muted-foreground">
                      Tracking continues even when your screen is locked or computer is sleeping
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Privacy Control</p>
                    <p className="text-xs text-muted-foreground">
                      Use pause when you want to take a break from tracking for privacy or personal
                      time
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Tip:</strong> You can pause tracking anytime from Settings. Your data is
                  always private and stored locally on your device.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handlePauseCancel}>
              Cancel
            </Button>
            <Button onClick={handlePauseConfirm}>Pause Tracking</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PauseTrackingSettings
