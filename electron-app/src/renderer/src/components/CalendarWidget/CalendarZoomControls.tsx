import { Minus, Plus } from 'lucide-react'
import { Button } from '../ui/button'

const CalendarZoomControls = ({
  handleZoomIn,
  handleZoomOut
}: {
  handleZoomIn: () => void
  handleZoomOut: () => void
}) => {
  return (
    <div className="absolute border-[1px] border-solid border-input rounded-md bg-card/80 backdrop-blur-sm bottom-8 right-8 z-40 flex flex-col gap-1">
      <Button
        variant="outline"
        size="2xs"
        onClick={handleZoomIn}
        className="border-none bg-transparent"
      >
        <Plus size={16} />
      </Button>
      <Button
        variant="outline"
        size="2xs"
        onClick={handleZoomOut}
        className="border-none bg-transparent"
      >
        <Minus size={16} />
      </Button>
    </div>
  )
}

export default CalendarZoomControls
