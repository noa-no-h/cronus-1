import React from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Pause, Clock, Monitor, Shield } from 'lucide-react'

interface PauseInfoModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

const PauseInfoModal: React.FC<PauseInfoModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                    Cronus tracks your activity 24/7 when your computer and the app is running
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
                    Use pause when you want to take a break from tracking for personal time
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> You can pause tracking anytime by clicking the pause button.
                Your data is always private and stored locally on your device.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-blue-500 hover:bg-blue-600">
            Pause Tracking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PauseInfoModal
