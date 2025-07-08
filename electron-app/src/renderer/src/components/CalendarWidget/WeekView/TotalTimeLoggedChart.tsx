import { TrendingDown, TrendingUp } from 'lucide-react'
import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { processColor } from '../../../lib/colors'
import type { ProcessedEventBlock } from '../../DashboardView'
import { notionStyleCategoryColors } from '../../Settings/CategoryForm'
import { Badge } from '../../ui/badge'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '../../ui/chart'

interface TotalTimeLoggedChartProps {
  processedEvents: ProcessedEventBlock[] | null
  isDarkMode: boolean
}

interface WeekSummary {
  startDate: Date
  endDate: Date
  totalDuration: number
}

export function TotalTimeLoggedChart({
  processedEvents,
  isDarkMode
}: TotalTimeLoggedChartProps): ReactElement {
  const weekData = useMemo<WeekSummary[]>(() => {
    if (!processedEvents || processedEvents.length === 0) {
      return []
    }

    const weeks: WeekSummary[] = []
    const now = new Date()

    // Get the 4 weeks, starting from 3 weeks ago
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay() - i * 7 + 1) // Monday start
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 7)

      const weekEvents = processedEvents.filter((event) => {
        const eventTime = event.startTime.getTime()
        return eventTime >= start.getTime() && eventTime < end.getTime()
      })

      const totalDuration = weekEvents.reduce((sum, event) => sum + event.durationMs, 0)

      weeks.push({
        startDate: start,
        endDate: end,
        totalDuration
      })
    }

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
      totalHours: parseFloat((week.totalDuration / (1000 * 60 * 60)).toFixed(1))
    }))
  }, [weekData])

  // Calculate trend
  const timeTrend = useMemo(() => {
    if (chartData.length < 2) return { change: 0, isPositive: true }

    const firstWeek = chartData[0]
    const lastWeek = chartData[chartData.length - 1]

    const change = ((lastWeek.totalHours - firstWeek.totalHours) / firstWeek.totalHours) * 100

    return {
      change: Math.abs(change),
      isPositive: change > 0
    }
  }, [chartData])

  const chartConfig = {
    totalHours: {
      label: 'Total Hours',
      color: processColor(notionStyleCategoryColors[0], { isDarkMode, opacity: 0.8 })
    }
  } satisfies ChartConfig

  return (
    <div className="border border-border rounded-lg bg-card p-4 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold text-foreground">Productivity Trend</h3>
        <Badge variant="secondary" className="text-xs">
          Overall Time
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Total hours logged over the last month</p>

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
              content={<ChartTooltipContent formatter={(value) => [`${value}h`, 'Total Time']} />}
            />
            <Line
              dataKey="totalHours"
              type="linear"
              stroke={chartConfig.totalHours.color}
              strokeWidth={2}
              dot={{
                fill: chartConfig.totalHours.color,
                strokeWidth: 2,
                r: 3
              }}
            />
          </LineChart>
        </ChartContainer>
      </div>

      <div className="flex items-center gap-2 text-sm mt-2">
        <div className="flex gap-2 leading-none font-medium">
          {timeTrend.isPositive ? (
            <>
              Trending up by {timeTrend.change.toFixed(1)}%{' '}
              <TrendingUp className="h-4 w-4 text-green-500" />
            </>
          ) : (
            <>
              Trending down by {timeTrend.change.toFixed(1)}%{' '}
              <TrendingDown className="h-4 w-4 text-red-500" />
            </>
          )}
        </div>
      </div>
      <div className="text-muted-foreground leading-none text-sm">
        Showing total hours logged over the last 4 weeks
      </div>
    </div>
  )
}
