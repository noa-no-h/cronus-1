import { Button } from './ui/button' // Assuming ShadCN Button component

interface CalendarWidgetProps {
  selectedDate: Date
  viewMode: 'day' | 'week'
  onDateChange: (newDate: Date) => void
  onViewModeChange: (newMode: 'day' | 'week') => void
}

const CalendarWidget = ({
  selectedDate,
  viewMode,
  onDateChange,
  onViewModeChange
}: CalendarWidgetProps) => {
  const handlePrev = () => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    onDateChange(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    onDateChange(newDate)
  }

  const formattedDate = selectedDate.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="w-full p-4 bg-card border border-border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrev} aria-label="Previous period">
            <span className="text-lg">←</span>
          </Button>
          <span className="text-sm font-medium text-foreground">{formattedDate}</span>
          <Button variant="outline" size="icon" onClick={handleNext} aria-label="Next period">
            <span className="text-lg">→</span>
          </Button>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant={viewMode === 'day' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('day')}
          >
            Day
          </Button>
          <Button
            variant={viewMode === 'week' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('week')}
          >
            Week
          </Button>
        </div>
      </div>
      {/* Calendar grid/view will go here later */}
      <div className="text-center text-muted-foreground">
        {viewMode === 'day' ? 'Day View Content Area' : 'Week View Content Area'}
      </div>
    </div>
  )
}

export default CalendarWidget
