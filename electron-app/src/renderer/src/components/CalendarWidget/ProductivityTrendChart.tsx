import { useMemo } from 'react'
import type { ReactElement } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { processColor } from '../../lib/colors'
import type { ProcessedEventBlock } from '../DashboardView'
import { notionStyleCategoryColors } from '../Settings/CategoryForm'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'
import { Badge } from '../ui/badge'

interface ProductivityTrendChartProps {
  processedEvents: ProcessedEventBlock[] | null
  isDarkMode: boolean
}

interface WeekSummary {
  startDate: Date
  endDate: Date
  totalProductiveDuration: number
  totalUnproductiveDuration: number
  totalWeekDuration: number
}

export function ProductivityTrendChart({
  processedEvents,
  isDarkMode
}: ProductivityTrendChartProps): ReactElement {
  const weekData = useMemo<WeekSummary[]>(() => {
    if (!processedEvents || processedEvents.length === 0) {
      return []
    }

    const weeks: WeekSummary[] = []
    const now = new Date()

    // Get the 4 weeks, starting from 3 weeks ago
    for (let i = 3; i >= 0; i--) {
      // Use the same week calculation as WeekOverWeekComparison
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay() - i * 7 + 1) // Monday start
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 7)

      console.log(`Week ${3 - i} boundaries:`, {
        start: start.toISOString(),
        end: end.toISOString(),
        weekNumber: 3 - i
      })

      const weekEvents = processedEvents.filter((event) => {
        const eventTime = event.startTime.getTime()
        return eventTime >= start.getTime() && eventTime < end.getTime()
      })

      console.log(`Week ${3 - i} events:`, {
        start: start.toISOString(),
        end: end.toISOString(),
        eventsCount: weekEvents.length,
        productiveEvents: weekEvents.filter((e) => e.isProductive).length,
        unproductiveEvents: weekEvents.filter((e) => !e.isProductive).length,
        firstEventTime: weekEvents[0]?.startTime.toISOString(),
        lastEventTime: weekEvents[weekEvents.length - 1]?.startTime.toISOString()
      })

      const totalProductiveDuration = weekEvents
        .filter((event) => event.isProductive)
        .reduce((sum, event) => sum + event.durationMs, 0)

      const totalUnproductiveDuration = weekEvents
        .filter((event) => !event.isProductive)
        .reduce((sum, event) => sum + event.durationMs, 0)

      const totalWeekDuration = totalProductiveDuration + totalUnproductiveDuration

      console.log(`Week ${3 - i} durations:`, {
        productiveHours: totalProductiveDuration / (1000 * 60 * 60),
        unproductiveHours: totalUnproductiveDuration / (1000 * 60 * 60),
        totalHours: totalWeekDuration / (1000 * 60 * 60)
      })

      weeks.push({
        startDate: start,
        endDate: end,
        totalProductiveDuration,
        totalUnproductiveDuration,
        totalWeekDuration
      })
    }

    // Sort weeks chronologically (oldest to newest)
    return weeks
  }, [processedEvents])

  const formatWeekLabel = (startDate: Date, endDate: Date): string => {
    const startMonth = startDate.toLocaleDateString(undefined, { month: 'short' })
    const endMonth = endDate.toLocaleDateString(undefined, { month: 'short' })
    const startDay = startDate.getDate()
    const endDay = endDate.getDate()

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`
    }
    return `${startMonth} ${startDay}-${endMonth} ${endDay}`
  }

  // Prepare chart data for line chart
  const chartData = useMemo(() => {
    return weekData.map((week, index) => ({
      week: `W${index + 1}`,
      weekLabel: formatWeekLabel(week.startDate, week.endDate),
      productiveHours: parseFloat((week.totalProductiveDuration / (1000 * 60 * 60)).toFixed(1)),
      unproductiveHours: parseFloat((week.totalUnproductiveDuration / (1000 * 60 * 60)).toFixed(1)),
      totalHours: parseFloat((week.totalWeekDuration / (1000 * 60 * 60)).toFixed(1))
    }))
  }, [weekData])

  // Calculate trend
  const productivityTrend = useMemo(() => {
    if (chartData.length < 2) return { change: 0, isPositive: true }

    const firstWeek = chartData[0]
    const lastWeek = chartData[chartData.length - 1]

    // If we only have data in the most recent week
    if (firstWeek.totalHours === 0 && lastWeek.totalHours > 0) {
      return { change: 100, isPositive: true }
    }

    // If we have no data at all
    if (firstWeek.totalHours === 0 && lastWeek.totalHours === 0) {
      return { change: 0, isPositive: true }
    }

    const firstProductivity =
      firstWeek.totalHours > 0 ? (firstWeek.productiveHours / firstWeek.totalHours) * 100 : 0
    const lastProductivity =
      lastWeek.totalHours > 0 ? (lastWeek.productiveHours / lastWeek.totalHours) * 100 : 0

    const change = lastProductivity - firstProductivity

    return {
      change: Math.abs(change),
      isPositive: change > 0
    }
  }, [chartData])

  const chartConfig = {
    productiveHours: {
      label: 'Productive Hours',
      color: processColor(notionStyleCategoryColors[0], { isDarkMode, opacity: 0.8 })
    }
  } satisfies ChartConfig

  return (
    <div className="border border-border rounded-lg bg-card p-4 mb-3 mt-3">
      <h3 className="text-lg font-semibold text-foreground mb-2">Productivity Trend</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Weekly productive hours over the last month
      </p>

      <div className="h-32">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full !aspect-auto flex justify-center text-xs"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 5,
              right: 60,
              top: 5,
              bottom: 25
            }}
            width={undefined}
            height={undefined}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="weekLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={20}
              fontSize={10}
              tick={({ x, y, payload }) => {
                const isCurrentWeek = payload.index === chartData.length - 1
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={0} textAnchor="middle" fontSize={10}>
                      {payload.value}
                    </text>
                    {isCurrentWeek && (
                      <foreignObject
                        x={-30}
                        y={5}
                        width={60}
                        height={20}
                        style={{ overflow: 'visible' }}
                      >
                        <div className="flex items-center justify-center">
                          <Badge
                            variant="secondary"
                            className="relative pl-5 whitespace-nowrap text-[10px]"
                          >
                            <span className="absolute left-2 top-[50%] -translate-y-[50%] flex items-center justify-center">
                              <span className="relative inline-flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full bg-red-500 h-2 w-2"></span>
                              </span>
                            </span>
                            This Week
                          </Badge>
                        </div>
                      </foreignObject>
                    )}
                  </g>
                )
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={10}
              tickFormatter={(value) => `${value}h`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    `${value}h`,
                    name === 'productiveHours' ? 'Productive' : 'Unproductive'
                  ]}
                />
              }
            />
            <Line
              dataKey="productiveHours"
              type="linear"
              stroke={chartConfig.productiveHours.color}
              strokeWidth={2}
              dot={{
                fill: chartConfig.productiveHours.color,
                strokeWidth: 2,
                r: 3
              }}
            />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Trend Summary */}
      <div className="flex items-center gap-2 text-sm mt-2">
        <div className="flex gap-2 leading-none font-medium">
          {productivityTrend.isPositive ? (
            <>
              Trending up by {productivityTrend.change.toFixed(1)}%{' '}
              <TrendingUp className="h-4 w-4 text-green-500" />
            </>
          ) : (
            <>
              Trending down by {productivityTrend.change.toFixed(1)}%{' '}
              <TrendingDown className="h-4 w-4 text-red-500" />
            </>
          )}
        </div>
      </div>
      <div className="text-muted-foreground leading-none text-sm">
        Showing productive hours over the last 4 weeks
      </div>
    </div>
  )
}
