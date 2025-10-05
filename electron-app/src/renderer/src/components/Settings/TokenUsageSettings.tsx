import React, { useEffect, useState } from 'react'
import { trpc } from '../../utils/trpc'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'
import { Badge } from '../../components/ui/badge'

interface TokenUsageSettingsProps {
  token: string | null
}

interface TokenData {
  date: string
  totalTokens: number
  byModel: Record<string, number>
  byEndpoint: Record<string, number>
  requests: number
  failures: number
}

export function TokenUsageSettings({ token }: TokenUsageSettingsProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [totalTokens, setTotalTokens] = useState<number>(0)
  const [modelUsage, setModelUsage] = useState<Record<string, any>>({})

  const { data: statsData, isLoading, refetch } = trpc.tokenUsage.getTokenUsageStats.useQuery(
    { token: token || '' },
    {
      enabled: !!token,
      refetchOnWindowFocus: false
    }
  )

  const { data: recentData, isLoading: isLoadingRecent } = trpc.tokenUsage.getRecentUsage.useQuery(
    { token: token || '', days: 7 },
    {
      enabled: !!token,
      refetchOnWindowFocus: false
    }
  )

  useEffect(() => {
    if (recentData && 'data' in recentData && recentData.success && recentData.data) {
      // Transform data for the chart
      const formattedData = recentData.data
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((day) => ({
          date: day.date.substring(5), // Just get MM-DD part for display
          tokens: day.totalTokens,
          requests: day.requests
        }))

      setChartData(formattedData)
    }
  }, [recentData])

  useEffect(() => {
    if (statsData && 'data' in statsData && statsData.success && statsData.data) {
      setTotalTokens(statsData.data.totalTokensUsed)
      setModelUsage(statsData.data.modelUsage)
    }
  }, [statsData])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  if (!token) {
    return (
      <div className="p-4 text-center">
        <p>Please log in to view token usage statistics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Token Usage Statistics</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Track your AI model token usage across the application
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Token Usage</CardTitle>
            <CardDescription>Aggregate token consumption</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="text-4xl font-bold">{formatNumber(totalTokens)}</div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">Total tokens used</div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last 7 Days Usage</CardTitle>
            <CardDescription>Daily token consumption trend</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px]">
            {isLoadingRecent ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tokens" fill="#8884d8" name="Tokens" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model Usage Breakdown</CardTitle>
          <CardDescription>Token usage by AI model</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(modelUsage).length > 0 ? (
                Object.entries(modelUsage).map(([model, stats]: [string, any]) => (
                  <div key={model} className="flex justify-between items-center">
                    <div>
                      <Badge variant="outline">{model}</Badge>
                      <span className="ml-2">{formatNumber(stats.totalTokens)} tokens</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {stats.requests} requests
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No model usage data available yet
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TokenUsageSettings