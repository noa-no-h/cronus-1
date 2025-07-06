import { Layers } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { CalendarHeaderDateNavigation } from './CalendarHeaderDateNavigation'

interface CalendarWidgetHeaderProps {
  handlePrev: () => void
  width: number
  formattedDate: string
  selectedDate: Date
  handleNext: () => void
  canGoNext: () => boolean
  viewMode: 'day' | 'week'
  onViewModeChange: (mode: 'day' | 'week') => void
  weekViewMode: 'stacked' | 'grouped'
  setWeekViewMode: (mode: 'stacked' | 'grouped') => void
  onDateSelect: (date: Date) => void
}

export const CalendarWidgetHeader = ({
  handlePrev,
  width,
  formattedDate,
  selectedDate,
  handleNext,
  canGoNext,
  viewMode,
  onViewModeChange,
  weekViewMode,
  setWeekViewMode,
  onDateSelect
}: CalendarWidgetHeaderProps) => {
  const compactDate = useMemo(() => {
    if (viewMode === 'week') {
      const match = formattedDate.match(/(\w{3})\s+(\d+)\s*-\s*(\w{3}?\s*)?(\d+)/)
      if (match) {
        const [, startMonth, startDay, endMonth, endDay] = match
        if (endMonth && endMonth.trim()) {
          return `${startMonth} ${startDay}-${endMonth.trim()} ${endDay}`
        }
        return `${startMonth} ${startDay}-${endDay}`
      }
      return formattedDate
    }
    // Use selectedDate for an accurate, simple, and timezone-correct date format.
    return selectedDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }, [formattedDate, selectedDate, viewMode])

  const fullDate = useMemo(() => {
    if (viewMode === 'week') {
      return formattedDate
    }
    // Use selectedDate for an accurate, simple, and timezone-correct date format.
    return selectedDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }, [formattedDate, selectedDate, viewMode])

  return (
    <div className="p-2 border-b rounded-t-xl shadow-sm sticky top-0 bg-card z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <CalendarHeaderDateNavigation
            handlePrev={handlePrev}
            handleNext={handleNext}
            canGoNext={canGoNext}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
            width={width}
            fullDate={fullDate}
            compactDate={compactDate}
            viewMode={viewMode}
          />
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
            variant="outline"
            size="xs"
            onClick={() => onViewModeChange(viewMode === 'day' ? 'week' : 'day')}
          >
            {viewMode === 'day' ? 'Week' : 'Day'}
          </Button>
        </div>
      </div>
    </div>
  )
}
