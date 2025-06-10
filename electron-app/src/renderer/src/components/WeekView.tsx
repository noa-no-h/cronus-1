import { useMemo } from 'react'
import { getDarkerColor, processColor } from '../lib/colors'
import type { ProcessedEventBlock } from './DashboardView'
import { TooltipProvider } from './ui/tooltip'

interface WeekViewProps {
  processedEvents: ProcessedEventBlock[] | null
  selectedDate: Date
  isDarkMode: boolean
}

interface CategoryTotal {
  categoryId: string | null
  name: string
  categoryColor?: string
  totalDurationMs: number
}

const MAX_DAY_DURATION_MS = 18 * 60 * 60 * 1000 // 18 hours

const formatDuration = (ms: number): string => {
  if (ms < 1000) return '0s'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

const WeekView = ({ processedEvents, selectedDate, isDarkMode }: WeekViewProps) => {
  const weekData = useMemo(() => {
    if (!processedEvents) {
      return []
    }

    const startOfWeek = new Date(selectedDate)
    // Use getDay() which returns 0 for Sunday, 1 for Monday, etc.
    const dayOfWeek = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)

    const days = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startOfWeek)
      day.setDate(day.getDate() + i)
      return day
    })

    return days.map((day) => {
      const dayStart = day.getTime()
      const dayEnd = new Date(day)
      dayEnd.setDate(day.getDate() + 1)
      const dayEndMs = dayEnd.getTime()

      const dayEvents =
        processedEvents?.filter((event) => {
          const eventTime = event.startTime.getTime()
          return eventTime >= dayStart && eventTime < dayEndMs
        }) || []

      const categoryTotals = new Map<string, CategoryTotal>()

      dayEvents.forEach((event) => {
        const key = event.categoryId || 'uncategorized'
        const categoryName = event.categoryName || 'Uncategorized'
        const existing = categoryTotals.get(key)

        if (existing) {
          existing.totalDurationMs += event.durationMs
        } else {
          categoryTotals.set(key, {
            categoryId: event.categoryId || null,
            name: categoryName,
            categoryColor: event.categoryColor || '#808080',
            totalDurationMs: event.durationMs
          })
        }
      })

      const totalDayDuration = Array.from(categoryTotals.values()).reduce(
        (sum, cat) => sum + cat.totalDurationMs,
        0
      )

      return {
        date: day,
        categoryTotals: Array.from(categoryTotals.values()).sort(
          (a, b) => b.totalDurationMs - a.totalDurationMs
        ),
        totalDayDuration
      }
    })
  }, [processedEvents, selectedDate])

  return (
    <TooltipProvider>
      <div className="flex-1 h-full">
        <div className="grid grid-cols-7 h-full">
          {weekData.map(({ date, categoryTotals, totalDayDuration }, index) => {
            const dayHeightPercentage = Math.min(
              100,
              (totalDayDuration / MAX_DAY_DURATION_MS) * 100
            )

            return (
              <div
                key={index}
                className={`flex flex-col border-1 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                  index === 6 ? 'border-r-0' : 'border-r'
                }`}
              >
                <div className="text-center text-xs p-1 border-b dark:border-slate-700">
                  <div className="font-semibold">
                    {date.toLocaleDateString(undefined, { weekday: 'short' })}
                  </div>
                  <div className="text-muted-foreground">
                    {date.toLocaleDateString(undefined, { day: 'numeric' })}
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-end relative overflow-hidden">
                  {totalDayDuration > 0 && (
                    <div
                      className="w-full flex flex-col transition-all duration-500 rounded-lg overflow-hidden"
                      style={{ height: `${dayHeightPercentage}%` }}
                    >
                      {categoryTotals.map((cat, catIndex) => {
                        const percentage = (cat.totalDurationMs / totalDayDuration) * 100
                        return (
                          <div
                            key={catIndex}
                            className="w-full transition-all duration-300 flex rounded-lg items-center justify-center text-center overflow-hidden"
                            style={{
                              height: `${percentage}%`,
                              backgroundColor: processColor(cat.categoryColor || '#808080', {
                                isDarkMode,
                                saturation: 1.2,
                                lightness: 1.1,
                                opacity: isDarkMode ? 0.7 : 0.5
                              })
                            }}
                          >
                            {percentage > 10 && (
                              <span
                                className="text-sm font-medium"
                                style={{
                                  color: getDarkerColor(
                                    cat.categoryColor || '#808080',
                                    isDarkMode ? 0.8 : 0.5
                                  )
                                }}
                              >
                                {formatDuration(cat.totalDurationMs)}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center text-xs p-1 border-t h-12 dark:border-slate-700 font-bold">
                  {formatDuration(totalDayDuration)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default WeekView
