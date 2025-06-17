import { formatDuration } from '@renderer/lib/activityByCategoryWidgetHelpers'
import { getTimeRangeDescription } from '@renderer/lib/activityMoving'
import React, { useEffect, useState } from 'react'
import { Category as SharedCategory } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { toast } from '../hooks/use-toast'
import { ActivityItem, ProcessedCategory, processActivityEvents } from '../lib/activityProcessing'
import { SYSTEM_EVENT_NAMES } from '../lib/constants'
import { trpc } from '../utils/trpc'
import { ActivityList } from './ActivityList'
import type { ProcessedEventBlock } from './DashboardView'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Skeleton } from './ui/skeleton'

interface ActivitiesByCategoryWidgetProps {
  processedEvents: ProcessedEventBlock[] | null
  isLoadingEvents: boolean
  startDateMs: number | null
  endDateMs: number | null
  refetchEvents: () => void
  selectedHour: number | null
  onHourSelect: (hour: number | null) => void
  selectedDay: Date | null
  onDaySelect: (day: Date | null) => void
}

const ActivitiesByCategoryWidget = ({
  processedEvents: todayProcessedEvents,
  isLoadingEvents: isLoadingEventsProp,
  startDateMs,
  endDateMs,
  refetchEvents,
  selectedHour,
  onHourSelect,
  selectedDay,
  onDaySelect
}: ActivitiesByCategoryWidgetProps) => {
  const { token } = useAuth()
  const [processedData, setProcessedData] = useState<ProcessedCategory[]>([])
  const [faviconErrors, setFaviconErrors] = useState<Set<string>>(new Set())
  const [hoveredActivityKey, setHoveredActivityKey] = useState<string | null>(null)
  const [openDropdownActivityKey, setOpenDropdownActivityKey] = useState<string | null>(null)
  const [showMore, setShowMore] = useState<Record<string, boolean>>({})

  const { data: categoriesData, isLoading: isLoadingCategories } =
    trpc.category.getCategories.useQuery({ token: token || '' }, { enabled: !!token })
  const categories = categoriesData as SharedCategory[] | undefined

  const updateCategoryMutation =
    trpc.activeWindowEvents.updateEventsCategoryInDateRange.useMutation({
      onSuccess: (_data, variables) => {
        refetchEvents()
        const targetCategory = categories?.find((cat) => cat._id === variables.newCategoryId)
        const targetCategoryName = targetCategory ? targetCategory.name : 'Unknown Category'

        toast({
          title: 'Activity Moved',
          description: `${variables.activityIdentifier} moved to ${targetCategoryName} ${getTimeRangeDescription(
            selectedHour,
            selectedDay,
            'day',
            startDateMs,
            endDateMs
          )}.`
        })
      },
      onError: (error) => {
        console.error('Error updating category:', error)
      }
    })

  useEffect(() => {
    if (isLoadingCategories || isLoadingEventsProp) {
      setProcessedData([])
      return
    }

    if (!categories || !todayProcessedEvents) {
      setProcessedData([])
      return
    }

    const filteredEvents = todayProcessedEvents.filter(
      (event) => !SYSTEM_EVENT_NAMES.includes(event.name)
    )

    const categoriesMap = new Map<string, SharedCategory>(
      (categories || []).map((cat: SharedCategory) => [cat._id, cat])
    )

    let processedCategoriesResult: ProcessedCategory[] = []

    if (filteredEvents.length === 0) {
      processedCategoriesResult = []
    } else {
      processedCategoriesResult = processActivityEvents(filteredEvents, categoriesMap)
    }

    const finalResult = processedCategoriesResult.sort((a, b) => {
      if (a.isProductive !== b.isProductive) {
        return a.isProductive ? -1 : 1
      }
      return b.totalDurationMs - a.totalDurationMs
    })

    setProcessedData(finalResult)
  }, [categories, todayProcessedEvents, isLoadingCategories, isLoadingEventsProp])

  const handleFaviconError = (identifier: string): void => {
    setFaviconErrors((prev) => new Set(prev).add(identifier))
  }

  const handleMoveActivity = (activity: ActivityItem, targetCategoryId: string) => {
    if (!token || startDateMs === null || endDateMs === null) {
      console.error('Missing token or date range for move operation')
      return
    }
    updateCategoryMutation.mutate({
      token,
      startDateMs,
      endDateMs,
      activityIdentifier: activity.identifier,
      itemType: activity.itemType,
      newCategoryId: targetCategoryId
    })
  }

  if (isLoadingEventsProp || isLoadingCategories) {
    return (
      <Card>
        <CardHeader></CardHeader>
        <CardContent className="space-y-4 pb-0">
          {[...Array(3)].map((_, i) => (
            <div key={`skel-cat-${i}`} className="space-y-2">
              <div className="flex justify-between items-center mb-1 pb-1 border-b border-border">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
              </div>
              {[...Array(2)].map((_, j) => (
                <div
                  key={`skel-act-${i}-${j}`}
                  className="flex items-center justify-between py-0.5"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                  <Skeleton className="h-4 w-1/5 ml-2" />
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (
    !todayProcessedEvents ||
    todayProcessedEvents.length === 0 ||
    processedData.every((p) => p.totalDurationMs === 0)
  ) {
    return (
      <Card>
        <CardContent className="space-y-4">
          {/* Show a message if there are no categories or if all categories have no time and no events */}
          {(!categories || categories.length === 0) &&
            (!todayProcessedEvents || todayProcessedEvents.length === 0) && (
              <p>No activity data for the selected period, or no categories defined.</p>
            )}
          {processedData.map((category) => {
            if (
              category.totalDurationMs === 0 &&
              (!todayProcessedEvents || todayProcessedEvents.length === 0)
            )
              return null // Don't render categories with no time if there are no events at all

            return (
              <div key={category.id}>
                <div className="sticky top-0 z-10 flex pl-2 justify-between items-center mb-1 border-b border-border bg-card py-2">
                  <div className="flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    ></span>
                    <h3 className="text-md font-semibold text-foreground">
                      {category.name.toUpperCase()}
                    </h3>
                  </div>
                  <span className="text-md font-semibold text-foreground">
                    {formatDuration(category.totalDurationMs)}
                  </span>
                </div>
                <ActivityList
                  activities={category.activities}
                  currentCategory={category}
                  allUserCategories={categories}
                  handleMoveActivity={handleMoveActivity}
                  isMovingActivity={updateCategoryMutation.isLoading}
                  faviconErrors={faviconErrors}
                  handleFaviconError={handleFaviconError}
                  isShowMore={!!showMore[category.id]}
                  onToggleShowMore={() =>
                    setShowMore((prev) => ({ ...prev, [category.id]: !prev[category.id] }))
                  }
                  hoveredActivityKey={hoveredActivityKey}
                  setHoveredActivityKey={setHoveredActivityKey}
                  openDropdownActivityKey={openDropdownActivityKey}
                  setOpenDropdownActivityKey={setOpenDropdownActivityKey}
                  selectedHour={selectedHour}
                  selectedDay={selectedDay}
                  viewMode="day"
                  startDateMs={startDateMs}
                  endDateMs={endDateMs}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 px-2 pt-2 pb-3">
        {selectedHour !== null && (
          <div className="flex justify-between items-center px-3 py-2 bg-muted rounded-sm">
            <span className="text-xs text-muted-foreground font-normal">
              Displaying activities for {selectedHour.toString().padStart(2, '0')}:00-
              {(selectedHour + 1).toString().padStart(2, '0')}:00
            </span>
            <Button variant="outline" size="xs" onClick={() => onHourSelect(null)}>
              Show Full Day
            </Button>
          </div>
        )}
        {selectedDay && (
          <div className="flex justify-between items-center px-3 py-2 bg-muted rounded-sm">
            <span className="text-xs text-muted-foreground font-normal">
              Displaying activities for{' '}
              {selectedDay.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <Button variant="outline" size="xs" onClick={() => onDaySelect(null)}>
              Show Full Week
            </Button>
          </div>
        )}
        {processedData.map((category) => {
          if (
            category.totalDurationMs === 0 &&
            (!todayProcessedEvents || todayProcessedEvents.length === 0)
          ) {
            return null // If no events at all for the day, and category is empty, skip it.
          }

          return (
            <div key={category.id}>
              <div className="sticky top-0 z-10 flex ml-2 justify-between items-center mb-1 border-b border-border bg-card py-2">
                <div className="flex items-center">
                  <span
                    className="w-4 h-4 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  ></span>
                  <h3 className="text-md font-semibold text-primary">{category.name}</h3>
                </div>
                <span className="text-md font-semibold text-foreground">
                  {formatDuration(category.totalDurationMs)}
                </span>
              </div>
              <ActivityList
                activities={category.activities}
                currentCategory={category}
                allUserCategories={categories}
                handleMoveActivity={handleMoveActivity}
                isMovingActivity={updateCategoryMutation.isLoading}
                faviconErrors={faviconErrors}
                handleFaviconError={handleFaviconError}
                isShowMore={!!showMore[category.id]}
                onToggleShowMore={() =>
                  setShowMore((prev) => ({ ...prev, [category.id]: !prev[category.id] }))
                }
                hoveredActivityKey={hoveredActivityKey}
                setHoveredActivityKey={setHoveredActivityKey}
                openDropdownActivityKey={openDropdownActivityKey}
                setOpenDropdownActivityKey={setOpenDropdownActivityKey}
                selectedHour={selectedHour}
                selectedDay={selectedDay}
                viewMode="day"
                startDateMs={startDateMs}
                endDateMs={endDateMs}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default React.memo(ActivitiesByCategoryWidget)
