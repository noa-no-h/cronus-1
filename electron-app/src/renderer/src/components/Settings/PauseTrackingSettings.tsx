import { Pause, Play } from 'lucide-react'
import React, { useState } from 'react'
import PauseInfoModal from '../PauseInfoModal'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

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
    if (!isTrackingPaused) {
      setShowPauseModal(true)
    } else {
      onToggleTracking()
    }
  }

  const handlePauseConfirm = () => {
    setShowPauseModal(false)
    onToggleTracking()
  }

  const handlePauseCancel = () => {
    setShowPauseModal(false)
  }

  return (
    <React.Fragment>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Pause Tracking</CardTitle>
          <CardDescription>
            We automatically track when your computer goes asleep/becomes inactive and pause the
            tracking accordingly. You can still pause tracking here if you do not want your activity
            to appear in the timeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <PauseInfoModal
        isOpen={showPauseModal}
        onClose={handlePauseCancel}
        onConfirm={handlePauseConfirm}
      />
    </React.Fragment>
  )
}

export default PauseTrackingSettings
