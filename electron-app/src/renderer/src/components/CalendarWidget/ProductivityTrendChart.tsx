import { useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { processColor } from '../../lib/colors'
import type { ProcessedEventBlock } from '../DashboardView'
import { notionStyleCategoryColors } from '../Settings/CategoryForm'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'

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
}: ProductivityTrendChartProps): JSX.Element {
  const weekData = useMemo<WeekSummary[]>(() => {
    if (!processedEvents) {
      return []
    }

    const weeks: WeekSummary[] = []
    const now = new Date()

    for (let i = 3; i >= 0; i--) {
      const start = new Date(now)
      const dayOfWeek = now.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      start.setDate(now.getDate() - daysToMonday - i * 7)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 7)

      const weekEvents = processedEvents.filter((event) => {
        const eventTime = event.startTime.getTime()
        return eventTime >= start.getTime() && eventTime < end.getTime()
      })

      const totalProductiveDuration = weekEvents
        .filter((event) => event.isProductive)
        .reduce((sum, event) => sum + event.durationMs, 0)

      const totalUnproductiveDuration = weekEvents
        .filter((event) => !event.isProductive)
        .reduce((sum, event) => sum + event.durationMs, 0)

      const totalWeekDuration = totalProductiveDuration + totalUnproductiveDuration

      weeks.push({
        startDate: start,
        endDate: end,
        totalProductiveDuration,
        totalUnproductiveDuration,
        totalWeekDuration
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
      <p className="text-sm text-muted-foreground mb-4">Weekly productive hours over time</p>

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
              right: 5,
              top: 5,
              bottom: 5
            }}
            width={undefined}
            height={undefined}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="weekLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={10}
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
