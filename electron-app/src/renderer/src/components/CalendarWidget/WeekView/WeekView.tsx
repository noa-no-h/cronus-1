import clsx from 'clsx'
import { useMemo } from 'react'
import { getDarkerColor, processColor } from '../../../lib/colors'
import type { ProcessedEventBlock } from '../../DashboardView'
import { notionStyleCategoryColors } from '../../Settings/CategoryForm'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import ProductiveCategoriesStackedBar from './ProductiveCategoriesStackedBar'

interface WeekViewProps {
  processedEvents: ProcessedEventBlock[] | null
  selectedDate: Date
  isDarkMode: boolean
  weekViewMode: 'stacked' | 'grouped'
  selectedDay: Date | null
  onDaySelect: (day: Date | null) => void
}

export interface CategoryTotal {
  categoryId: string | null
  name: string
  categoryColor?: string
  totalDurationMs: number
  isProductive?: boolean
  _otherCategories?: Array<{ name: string; duration: number }>
}

const formatDuration = (ms: number): string | null => {
  if (ms < 1000) return null
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

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
    const dayOfWeek = startOfWeek.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract)

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

  // Find the max totalDayDuration for the week (avoid 0 by defaulting to 1)
  const maxDayDurationMs = useMemo(() => {
    if (!weekData.length) return 1
    return Math.max(1, ...weekData.map((d) => d.totalDayDuration))
  }, [weekData])

  // The tallest bar should be 80% of the height
  const maxBarHeightPercent = 80

  // For grouped view: find the max single bar (productive or unproductive) duration in the week
  const maxSingleBarDuration = useMemo(() => {
    if (!weekData.length) return 1
    let max = 1
    for (const d of weekData) {
      max = Math.max(max, d.totalProductiveDuration, d.totalUnproductiveDuration)
    }
    return max
  }, [weekData])

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
              // Use dynamic max for both stacked and grouped views
              const stackedMax = maxDayDurationMs
              const groupedMax = maxSingleBarDuration
              const dayHeightPercentage = Math.min(
                maxBarHeightPercent,
                (totalDayDuration / (weekViewMode === 'stacked' ? stackedMax : maxDayDurationMs)) *
                  maxBarHeightPercent
              )
              const isCurrentDay = date.toDateString() === new Date().toDateString()
              const isSelectedDay = selectedDay?.toDateString() === date.toDateString()

              // For grouped view: scale each bar by maxSingleBarDuration
              const productiveHeight = Math.min(
                maxBarHeightPercent,
                (totalProductiveDuration / groupedMax) * maxBarHeightPercent
              )
              const unproductiveHeight = Math.min(
                maxBarHeightPercent,
                (totalUnproductiveDuration / groupedMax) * maxBarHeightPercent
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
                          className="w-full flex flex-col transition-all duration-500 gap-px"
                          style={{ height: `${dayHeightPercentage}%` }}
                        >
                          {/* Productive section */}
                          {totalProductiveDuration > 0 && (
                            <ProductiveCategoriesStackedBar
                              productiveCategories={productiveCategories}
                              totalProductiveDuration={totalProductiveDuration}
                              productivePercentage={productivePercentage}
                              isDarkMode={isDarkMode}
                            />
                          )}
                          {/* Unproductive section */}
                          {totalUnproductiveDuration > 0 &&
                            (() => {
                              // Group small categories (< 20 min) into one 'Other' at the bottom
                              const twentyMinMs = 20 * 60 * 1000
                              const large = unproductiveCategories.filter(
                                (cat) => cat.totalDurationMs >= twentyMinMs
                              )
                              const small = unproductiveCategories.filter(
                                (cat) => cat.totalDurationMs < twentyMinMs
                              )
                              let grouped = [...large]
                              let otherCategories: Array<{ name: string; duration: number }> = []
                              if (small.length > 0) {
                                const otherDuration = small.reduce(
                                  (sum, cat) => sum + cat.totalDurationMs,
                                  0
                                )
                                otherCategories = small.map((cat) => ({
                                  name: cat.name,
                                  duration: cat.totalDurationMs
                                }))
                                grouped.push({
                                  categoryId: 'other',
                                  name: 'Other',
                                  categoryColor: '#808080',
                                  totalDurationMs: otherDuration,
                                  isProductive: false,
                                  _otherCategories: otherCategories
                                })
                              }
                              // Sort by duration descending, but always put 'Other' last if present
                              grouped = grouped
                                .filter((cat) => cat.categoryId !== 'other')
                                .sort((a, b) => b.totalDurationMs - a.totalDurationMs)
                              if (otherCategories.length > 0) {
                                grouped.push({
                                  categoryId: 'other',
                                  name: 'Other',
                                  categoryColor: '#808080',
                                  totalDurationMs: otherCategories.reduce(
                                    (sum, c) => sum + c.duration,
                                    0
                                  ),
                                  isProductive: false,
                                  _otherCategories: otherCategories
                                })
                              }
                              return (
                                <div
                                  className="w-full flex flex-col gap-px"
                                  style={{ height: `${unproductivePercentage}%` }}
                                >
                                  {grouped.map((cat, catIndex) => {
                                    const percentage =
                                      (cat.totalDurationMs / totalUnproductiveDuration) * 100
                                    const showLabel = cat.totalDurationMs >= 30 * 60 * 1000 // 30 min
                                    const isOther = cat.categoryId === 'other'
                                    return (
                                      <Tooltip key={catIndex} delayDuration={100}>
                                        <TooltipTrigger asChild>
                                          <div
                                            className="w-full transition-all duration-300 rounded-lg flex items-center justify-center text-center overflow-hidden"
                                            style={{
                                              height: `${percentage}%`,
                                              backgroundColor: processColor(
                                                isOther
                                                  ? '#808080'
                                                  : cat.categoryColor || '#808080',
                                                {
                                                  isDarkMode,
                                                  saturation: 1.2,
                                                  lightness: 1.1,
                                                  opacity: isDarkMode ? 0.7 : 0.5
                                                }
                                              )
                                            }}
                                          >
                                            {percentage > 10 && showLabel && (
                                              <span
                                                className="text-sm font-medium"
                                                style={{
                                                  color: getDarkerColor(
                                                    isOther
                                                      ? '#808080'
                                                      : cat.categoryColor || '#808080',
                                                    isDarkMode ? 0.8 : 0.5
                                                  )
                                                }}
                                              >
                                                {formatDuration(cat.totalDurationMs)}
                                              </span>
                                            )}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" align="center">
                                          {isOther && cat._otherCategories
                                            ? [
                                                <div key="other-title">
                                                  <b>Other:</b>
                                                </div>,
                                                ...cat._otherCategories.map((c, i) => (
                                                  <div key={i}>
                                                    {c.name}: {formatDuration(c.duration) || ''}
                                                  </div>
                                                ))
                                              ]
                                            : cat.name}
                                        </TooltipContent>
                                      </Tooltip>
                                    )
                                  })}
                                </div>
                              )
                            })()}
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
                  <div className="flex flex-col items-center justify-center text-muted-foreground text-xs font-normal p-1 border-t h-16 dark:border-slate-700">
                    {totalDayDuration > 0 ? (
                      <>
                        <div className="text-foreground font-medium">
                          {formatDuration(totalDayDuration)}
                        </div>
                        <div className="flex flex-col items-left gap-0.5 mt-1">
                          {totalProductiveDuration > 0 && (
                            <div className="flex items-left gap-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: processColor(notionStyleCategoryColors[0], {
                                    isDarkMode,
                                    opacity: isDarkMode ? 0.7 : 0.6
                                  })
                                }}
                              />
                              <span>{formatDuration(totalProductiveDuration)}</span>
                            </div>
                          )}
                          {totalUnproductiveDuration > 0 && (
                            <div className="flex items-left gap-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: processColor(notionStyleCategoryColors[1], {
                                    isDarkMode,
                                    opacity: isDarkMode ? 0.7 : 0.6
                                  })
                                }}
                              />
                              <span>{formatDuration(totalUnproductiveDuration)}</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div>No data</div>
                    )}
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
