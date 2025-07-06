import { useMemo } from 'react'
import { processColor } from '../../lib/colors'
import type { ProcessedEventBlock } from '../DashboardView'
import { notionStyleCategoryColors } from '../Settings/CategoryForm'
import { TooltipProvider } from '../ui/tooltip'

interface WeekOverWeekComparisonProps {
  processedEvents: ProcessedEventBlock[] | null
  isDarkMode: boolean
  weekViewMode: 'stacked' | 'grouped'
}

interface CategoryTotal {
  categoryId: string | null
  name: string
  categoryColor?: string
  totalDurationMs: number
  isProductive?: boolean
}

interface WeekSummary {
  startDate: Date
  endDate: Date
  productiveCategories: CategoryTotal[]
  totalProductiveDuration: number
  totalUnproductiveDuration: number
  totalWeekDuration: number
}

export function WeekOverWeekComparison({
  processedEvents,
  isDarkMode
}: WeekOverWeekComparisonProps) {
  const weekData = useMemo<WeekSummary[]>(() => {
    if (!processedEvents) {
      return []
    }

    const weeks: WeekSummary[] = []
    const now = new Date()

    for (let i = 3; i >= 0; i--) {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay() - i * 7 + 1)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 7)

      const weekEvents = processedEvents.filter((event) => {
        const eventTime = event.startTime.getTime()
        return eventTime >= start.getTime() && eventTime < end.getTime()
      })

      const productiveCategoriesMap = new Map<string, CategoryTotal>()
      const unproductiveCategoriesMap = new Map<string, CategoryTotal>()

      weekEvents.forEach((event) => {
        const key = event.categoryId || 'uncategorized'
        const targetMap = event.isProductive ? productiveCategoriesMap : unproductiveCategoriesMap

        const existing = targetMap.get(key)
        if (existing) {
          existing.totalDurationMs += event.durationMs
        } else {
          targetMap.set(key, {
            categoryId: event.categoryId || null,
            name: event.categoryName || 'Uncategorized',
            categoryColor: event.categoryColor || '#808080',
            totalDurationMs: event.durationMs,
            isProductive: event.isProductive
          })
        }
      })

      const productiveCategories = Array.from(productiveCategoriesMap.values()).sort(
        (a, b) => b.totalDurationMs - a.totalDurationMs
      )
      const totalProductiveDuration = productiveCategories.reduce(
        (sum, cat) => sum + cat.totalDurationMs,
        0
      )
      const totalUnproductiveDuration = Array.from(unproductiveCategoriesMap.values()).reduce(
        (sum, cat) => sum + cat.totalDurationMs,
        0
      )
      const totalWeekDuration = totalProductiveDuration + totalUnproductiveDuration

      weeks.push({
        startDate: start,
        endDate: end,
        productiveCategories,
        totalProductiveDuration,
        totalUnproductiveDuration,
        totalWeekDuration
      })
    }

    return weeks
  }, [processedEvents])

  const formatWeekLabel = (startDate: Date, endDate: Date) => {
    const startMonth = startDate.toLocaleDateString(undefined, { month: 'short' })
    const endMonth = endDate.toLocaleDateString(undefined, { month: 'short' })
    const startDay = startDate.getDate()
    const endDay = endDate.getDate()

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`
    }
    return `${startMonth} ${startDay}-${endMonth} ${endDay}`
  }

  return (
    <TooltipProvider>
      <div className="border border-border rounded-lg bg-card p-4 mb-3 mt-3">
        <h3 className="text-lg font-semibold text-foreground">Week-over-Week Trend</h3>
        <p className="text-sm text-muted-foreground">Productivity Ratio</p>
        <div className="h-48 flex flex-col">
          <div className="grid grid-cols-4 gap-2 h-32">
            {weekData.map(
              (
                {
                  startDate,
                  endDate,
                  totalProductiveDuration,
                  totalUnproductiveDuration,
                  totalWeekDuration
                },
                index
              ) => {
                const productivePercentage =
                  totalWeekDuration > 0 ? (totalProductiveDuration / totalWeekDuration) * 100 : 0
                const unproductivePercentage =
                  totalWeekDuration > 0 ? (totalUnproductiveDuration / totalWeekDuration) * 100 : 0

                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-xs font-medium text-foreground mb-1">
                      {formatWeekLabel(startDate, endDate)}
                    </div>

                    <div className="w-full h-full flex flex-col justify-end">
                      {totalWeekDuration > 0 ? (
                        <div className="w-full h-full flex flex-col">
                          {totalProductiveDuration > 0 && (
                            <div
                              className="w-full transition-all duration-300 rounded-t-sm"
                              style={{
                                height: `${productivePercentage}%`,
                                backgroundColor: processColor(notionStyleCategoryColors[0], {
                                  isDarkMode,
                                  opacity: isDarkMode ? 0.7 : 0.6
                                })
                              }}
                            />
                          )}
                          {totalUnproductiveDuration > 0 && (
                            <div
                              className="w-full transition-all duration-300 rounded-b-sm"
                              style={{
                                height: `${unproductivePercentage}%`,
                                backgroundColor: processColor(notionStyleCategoryColors[1], {
                                  isDarkMode,
                                  opacity: isDarkMode ? 0.7 : 0.6
                                })
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-sm flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No data</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mt-2">
            {weekData.map((week, index) => {
              const productivePercentage =
                week.totalWeekDuration > 0
                  ? (week.totalProductiveDuration / week.totalWeekDuration) * 100
                  : 0
              const unproductivePercentage =
                week.totalWeekDuration > 0
                  ? (week.totalUnproductiveDuration / week.totalWeekDuration) * 100
                  : 0

              return (
                <div key={index} className="text-left">
                  {week.totalWeekDuration > 0 ? (
                    <>
                      <div className="text-xs text-foreground font-medium">
                        Productive: {Math.round(productivePercentage)}%
                      </div>
                      <div className="text-xs text-foreground font-medium">
                        Unproductive: {Math.round(unproductivePercentage)}%
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">No tracking</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
