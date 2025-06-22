import { ChevronLeft, ChevronRight, Layers, Minus, Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'

interface CalendarWidgetHeaderProps {
  handlePrev: () => void
  width: number
  formattedDate: string
  handleNext: () => void
  canGoNext: () => boolean
  handleZoomOut: () => void
  handleZoomIn: () => void
  viewMode: 'day' | 'week'
  onViewModeChange: (mode: 'day' | 'week') => void
  weekViewMode: 'stacked' | 'grouped'
  setWeekViewMode: (mode: 'stacked' | 'grouped') => void
}

export const CalendarWidgetHeader = ({
  handlePrev,
  width,
  formattedDate,
  handleNext,
  canGoNext,
  handleZoomOut,
  handleZoomIn,
  viewMode,
  onViewModeChange,
  weekViewMode,
  setWeekViewMode
}: CalendarWidgetHeaderProps) => {
  return (
    <div className="p-2 border-b rounded-t-xl shadow-sm sticky top-0 bg-card z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="xs" onClick={handlePrev}>
            <ChevronLeft size={20} />
          </Button>
          {width >= 1000 && (
            <span className="text-sm text-muted-foreground font-medium">{formattedDate}</span>
          )}
          <Button variant="outline" size="xs" onClick={handleNext} disabled={!canGoNext()}>
            <ChevronRight size={20} />
          </Button>
          {viewMode === 'day' && (
            <>
              <Button variant="outline" size="xs" onClick={handleZoomOut}>
                <Minus size={20} />
              </Button>
              <Button variant="outline" size="xs" onClick={handleZoomIn}>
                <Plus size={20} />
              </Button>
            </>
          )}
        </div>
        {viewMode === 'week' && (
          <div className="flex items-center space-x-2">
            <Switch
              id="week-view-mode"
              checked={weekViewMode === 'stacked'}
              onCheckedChange={(checked) => setWeekViewMode(checked ? 'stacked' : 'grouped')}
            />
            {width >= 1000 ? (
              <Label htmlFor="week-view-mode" className="text-muted-foreground font-normal">
                Stacked
              </Label>
            ) : (
              <Label htmlFor="week-view-mode" className="text-muted-foreground">
                <Layers className="text-muted-foreground" size={16} />
              </Label>
            )}
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'day' ? 'secondary' : 'outline'}
            size="xs"
            onClick={() => onViewModeChange('day')}
          >
            Day
          </Button>
          <Button
            variant={viewMode === 'week' ? 'secondary' : 'outline'}
            size="xs"
            onClick={() => onViewModeChange('week')}
          >
            Week
          </Button>
        </div>
      </div>
    </div>
  )
}
