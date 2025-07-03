import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'

interface TutorialModalProps {
  isFirstVisit: boolean
  onClose: () => void
}

export function TutorialModal({ isFirstVisit, onClose }: TutorialModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isFirstVisit) {
      setTimeout(() => {
        setIsOpen(true)
      }, 1000)
    }
  }, [isFirstVisit])

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex h-[80vh] w-full max-w-4xl flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold">
            Welcome to Cronus AI! Here&apos;s how it works
          </DialogTitle>
          <DialogDescription className="sr-only">
            Interactive tutorial showing how to use Cronus for productivity tracking
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 px-6">
          <div className="h-full w-full overflow-hidden rounded-lg">
            <iframe
              src="https://www.loom.com/embed/34531aee1ce94343a2c4c7cee04a0dc8"
              className="h-full w-full border-0"
              allowFullScreen
              title="Cronus Tutorial"
            />
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              💡 You can always re-watch this tutorial from the help menu
            </p>
            <Button onClick={handleClose} className="min-w-[120px]">
              Got it, let&apos;s start!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
