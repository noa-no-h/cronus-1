import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog'
import { Button } from './ui/button'
import chromeAppleEventsScreenshot from '../assets/chrome-apple-events-screenshot.png'

export function ChromeAppleEventsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get the Most Accurate Insights in Chrome</DialogTitle>
          <DialogDescription>
            To give you the best possible overview of your work and day, please enable this setting
            in Chrome - Only takes a few seconds.
          </DialogDescription>
        </DialogHeader>
        <ol className="list-decimal pl-6 text-left text-base space-y-2 mt-2">
          <li>
            Open Chrome and click the <b>View</b> menu at the top of your screen.
          </li>
          <li>
            Select <b>Developer</b> &rarr; <b>Allow JavaScript from Apple Events</b>.
          </li>
          <li>
            If you don’t see the Developer menu, you may need to enable it in Chrome’s settings
            first.
          </li>
        </ol>
        <div className="mt-4 text-sm text-muted-foreground bg-muted/30 rounded p-2">
          <b>Note:</b> This step is only needed if you use Chrome.
          <br />
          If you use Safari, no extra setup is needed—Safari works out of the box!
        </div>
        <div className="flex flex-col items-center gap-4 py-4">
          <img
            src={chromeAppleEventsScreenshot}
            alt="How to enable JavaScript from Apple Events in Chrome"
            className="rounded-lg border shadow-lg max-w-full"
          />
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
