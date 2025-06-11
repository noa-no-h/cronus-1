import clsx from 'clsx'
import { useMemo } from 'react'
import { getDarkerColor, processColor } from '../lib/colors'
import type { ProcessedEventBlock } from './DashboardView'
import { notionStyleCategoryColors } from './settings/CategoryManagement'
import { TooltipProvider } from './ui/tooltip'

interface WeekViewProps {
  processedEvents: ProcessedEventBlock[] | null
  selectedDate: Date
  isDarkMode: boolean
  weekViewMode: 'stacked' | 'grouped'
  selectedDay: Date | null
  onDaySelect: (day: Date | null) => void
}

interface CategoryTotal {
  categoryId: string | null
  name: string
  categoryColor?: string
  totalDurationMs: number
  isProductive?: boolean
}

const MAX_DAY_DURATION_MS = 18 * 60 * 60 * 1000 // 18 hours

const formatDuration = (ms: number): string | null => {
  if (ms < 1000) return null
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m`
  }
  return null
}

const WeekView = ({
  processedEvents,
  selectedDate,
  isDarkMode,
  weekViewMode,
  selectedDay,
  onDaySelect
}: WeekViewProps) => {
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

      const productiveCategoriesMap = new Map<string, CategoryTotal>()
      const unproductiveCategoriesMap = new Map<string, CategoryTotal>()

      dayEvents.forEach((event) => {
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
      const unproductiveCategories = Array.from(unproductiveCategoriesMap.values()).sort(
        (a, b) => b.totalDurationMs - a.totalDurationMs
      )

      const totalProductiveDuration = productiveCategories.reduce(
        (sum, cat) => sum + cat.totalDurationMs,
        0
      )
      const totalUnproductiveDuration = unproductiveCategories.reduce(
        (sum, cat) => sum + cat.totalDurationMs,
        0
      )
      const totalDayDuration = totalProductiveDuration + totalUnproductiveDuration

      return {
        date: day,
        productiveCategories,
        unproductiveCategories,
        totalProductiveDuration,
        totalUnproductiveDuration,
        totalDayDuration
      }
    })
  }, [processedEvents, selectedDate])

  return (
    <TooltipProvider>
      <div className="flex-1 h-full flex flex-col">
        <div className="grid grid-cols-7 h-full">
          {weekData.map(
            (
              {
                date,
                productiveCategories,
                unproductiveCategories,
                totalProductiveDuration,
                totalUnproductiveDuration,
                totalDayDuration
              },
              index
            ) => {
              const dayHeightPercentage = Math.min(
                100,
                (totalDayDuration / MAX_DAY_DURATION_MS) * 100
              )
              const isCurrentDay = date.toDateString() === new Date().toDateString()
              const isSelectedDay = selectedDay?.toDateString() === date.toDateString()

              // For grouped view
              const productiveHeight = Math.min(
                100,
                (totalProductiveDuration / MAX_DAY_DURATION_MS) * 100
              )
              const unproductiveHeight = Math.min(
                100,
                (totalUnproductiveDuration / MAX_DAY_DURATION_MS) * 100
              )

              // For stacked view
              const productivePercentage =
                totalDayDuration > 0 ? (totalProductiveDuration / totalDayDuration) * 100 : 0
              const unproductivePercentage =
                totalDayDuration > 0 ? (totalUnproductiveDuration / totalDayDuration) * 100 : 0

              return (
                <div
                  key={index}
                  className={`flex flex-col border-1 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                    index === 6 ? 'border-r-0' : 'border-r'
                  } ${isSelectedDay ? 'bg-blue-200/20 dark:bg-blue-800/30' : ''}`}
                  onClick={() => onDaySelect(isSelectedDay ? null : date)}
                >
                  <div
                    className={clsx(
                      'text-center text-xs p-1 border-b dark:border-slate-700',
                      isCurrentDay && !isSelectedDay ? 'bg-blue-100 dark:bg-blue-900' : ''
                    )}
                  >
                    <div className="font-semibold">
                      {date.toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                    <div className="text-muted-foreground">
                      {date.toLocaleDateString(undefined, { day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-end relative overflow-hidden">
                    {totalDayDuration > 0 &&
                      (weekViewMode === 'stacked' ? (
                        <div
                          className="w-full flex flex-col transition-all duration-500 rounded-lg overflow-hidden"
                          style={{ height: `${dayHeightPercentage}%` }}
                        >
                          {/* Productive section */}
                          {totalProductiveDuration > 0 && (
                            <div
                              className="w-full flex flex-col overflow-hidden"
                              style={{ height: `${productivePercentage}%` }}
                            >
                              {productiveCategories.map((cat, catIndex) => {
                                const percentage =
                                  (cat.totalDurationMs / totalProductiveDuration) * 100
                                return (
                                  <div
                                    key={catIndex}
                                    className="w-full transition-all duration-300 rounded-lg flex items-center justify-center text-center overflow-hidden"
                                    style={{
                                      height: `${percentage}%`,
                                      backgroundColor: processColor(
                                        cat.categoryColor || '#808080',
                                        {
                                          isDarkMode,
                                          saturation: 1.2,
                                          lightness: 1.1,
                                          opacity: isDarkMode ? 0.7 : 0.5
                                        }
                                      )
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
                          {/* Unproductive section */}
                          {totalUnproductiveDuration > 0 && (
                            <div
                              className="w-full flex flex-col rounded-lg overflow-hidden"
                              style={{ height: `${unproductivePercentage}%` }}
                            >
                              {unproductiveCategories.map((cat, catIndex) => {
                                const percentage =
                                  (cat.totalDurationMs / totalUnproductiveDuration) * 100
                                return (
                                  <div
                                    key={catIndex}
                                    className="w-full transition-all duration-300 flex items-center justify-center text-center overflow-hidden"
                                    style={{
                                      height: `${percentage}%`,
                                      backgroundColor: processColor(
                                        cat.categoryColor || '#808080',
                                        {
                                          isDarkMode,
                                          saturation: 1.2,
                                          lightness: 1.1,
                                          opacity: isDarkMode ? 0.7 : 0.5
                                        }
                                      )
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
                      ) : (
                        // Grouped View
                        <div className="w-full h-full flex flex-row justify-evenly items-end">
                          {totalProductiveDuration > 0 && (
                            <div
                              className="w-1/3 transition-all duration-300 flex rounded-lg items-center justify-center text-center overflow-hidden"
                              style={{
                                height: `${productiveHeight}%`,
                                backgroundColor: processColor(notionStyleCategoryColors[0], {
                                  isDarkMode,
                                  opacity: isDarkMode ? 0.7 : 0.6
                                })
                              }}
                            />
                          )}
                          {totalUnproductiveDuration > 0 && (
                            <div
                              className="w-1/3 transition-all duration-300 flex rounded-lg items-center justify-center text-center overflow-hidden"
                              style={{
                                height: `${unproductiveHeight}%`,
                                backgroundColor: processColor(notionStyleCategoryColors[1], {
                                  isDarkMode,
                                  opacity: isDarkMode ? 0.7 : 0.6
                                })
                              }}
                            />
                          )}
                        </div>
                      ))}
                  </div>
                  <div className="flex items-center justify-center text-muted-foreground text-xs font-normal p-1 border-t h-12 dark:border-slate-700">
                    {formatDuration(totalDayDuration)}
                  </div>
                </div>
              )
            }
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default WeekView
