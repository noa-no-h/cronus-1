import { extractWebsiteInfo, formatDuration } from '@renderer/lib/activityByCategoryWidgetHelpers'
import React, { useEffect, useState } from 'react'
import { ActiveWindowEvent, Category as SharedCategory } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { toast } from '../hooks/use-toast'
import { getFaviconURL } from '../utils/favicon'
import { trpc } from '../utils/trpc'
import AppIcon from './AppIcon'
import type { ProcessedEventBlock } from './DashboardView'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { Skeleton } from './ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface ActivityItem {
  name: string
  durationMs: number
  itemType: 'app' | 'website'
  identifier: string
  originalUrl?: string
}

interface ProcessedCategory {
  id: string
  name: string
  color: string
  isProductive: boolean
  totalDurationMs: number
  activities: ActivityItem[]
}

interface ActivitiesByCategoryWidgetProps {
  processedEvents: ProcessedEventBlock[] | null
  isLoadingEvents: boolean
  startDateMs: number | null
  endDateMs: number | null
  refetchEvents: () => void
  selectedHour: number | null
  onHourSelect: (hour: number | null) => void
}

const extractActivityDetailsFromEvent = (
  event: ActiveWindowEvent
): {
  activityName: string
  itemType: ActivityItem['itemType']
  identifier: string
  originalUrl?: string
} => {
  let activityName = event.ownerName
  let itemType: ActivityItem['itemType'] = 'app'
  let identifier = event.ownerName
  let originalUrl: string | undefined = undefined

  if (event.url) {
    // Case 1: Event has a URL - clearly a website.
    const websiteInfo = extractWebsiteInfo(event.url, event.title || event.ownerName)
    activityName = websiteInfo.name
    itemType = 'website'
    identifier = websiteInfo.domain
    originalUrl = event.url
  } else if (
    // Sometimes url is missing but it a browser event
    (event.ownerName.toLowerCase().includes('google chrome') ||
      event.ownerName.toLowerCase().includes('safari') ||
      event.ownerName.toLowerCase().includes('firefox')) &&
    event.title &&
    event.title.trim() !== ''
  ) {
    // Case 2: Event is from Google Chrome, has no URL, but has a usable title.
    // Treat this as a web-like activity, using the title as its name and identifier.
    activityName = event.title.trim()
    itemType = 'website'
    identifier = event.title.trim()
  } else {
    // Case 3: Fallback - treated as a generic app.
    // This will catch non-Chrome apps, or Chrome instances with no URL and no title.
    // console.log('Event classified as generic app:', event); // General log for non-website events
  }
  return { activityName, itemType, identifier, originalUrl }
}

const processActivityEvents = (
  processedBlocks: ProcessedEventBlock[],
  categoriesMap: Map<string, SharedCategory>
): ProcessedCategory[] => {
  // This accumulator will hold activities grouped by their category ID.
  // For each category, it stores the category's details and a map of its activities.
  // The inner 'activitiesMap' maps an activity's display name to its full ActivityItem details (duration, type, etc.).
  const categoryActivityAccumulator: Record<
    string, // categoryId
    { categoryDetails: SharedCategory; activitiesMap: Map<string, ActivityItem> }
  > = {}

  // Iterate through processed blocks
  for (const block of processedBlocks) {
    const categoryId = block.categoryId
    if (!categoryId) continue

    const categoryDetails = categoriesMap.get(categoryId)
    if (!categoryDetails) {
      // console.warn(`Category details not found for categoryId: ${categoryId}. Skipping event.`);
      continue
    }

    // Duration is already calculated in ProcessedEventBlock
    const durationMs = block.durationMs
    // No need to cap or check for 0 duration here if DashboardView handles it, but good to be defensive
    if (durationMs <= 0) continue

    // Extract display name, type (app/website), identifier (app name/domain), and URL for the current activity.
    // Use block.originalEvent as extractActivityDetailsFromEvent expects ActiveWindowEvent
    const { activityName, itemType, identifier, originalUrl } = extractActivityDetailsFromEvent(
      block.originalEvent
    )

    // Ensure an entry for the category exists in the accumulator.
    if (!categoryActivityAccumulator[categoryId]) {
      categoryActivityAccumulator[categoryId] = {
        categoryDetails,
        activitiesMap: new Map<string, ActivityItem>() // Initialize map for this category's activities
      }
    }

    // Aggregate duration and details for the specific activity within its category.
    const { activitiesMap } = categoryActivityAccumulator[categoryId]
    const existingActivity = activitiesMap.get(activityName)

    activitiesMap.set(activityName, {
      name: activityName,
      durationMs: (existingActivity?.durationMs || 0) + durationMs,
      itemType,
      identifier,
      originalUrl
    })
  }

  // Transform the accumulated data into the final array of ProcessedCategory objects.
  // Each object will represent a category and include its total time and a list of its activities.
  const result: ProcessedCategory[] = Object.values(categoryActivityAccumulator).map((data) => {
    // Convert the map of activities (Map<string, ActivityItem>) into an array of ActivityItem objects.
    const activityItems: ActivityItem[] = Array.from(data.activitiesMap.values())
    // Calculate the total time spent in this category by summing durations of all its activities.
    const totalCategoryDurationMs = activityItems.reduce((sum, act) => sum + act.durationMs, 0)

    return {
      id: data.categoryDetails._id,
      name: data.categoryDetails.name,
      color: data.categoryDetails.color,
      isProductive: data.categoryDetails.isProductive,
      totalDurationMs: totalCategoryDurationMs,
      // Sort activities within this category by duration, descending (longest first).
      activities: activityItems.sort((a, b) => b.durationMs - a.durationMs)
    }
  })
  return result // This is the array of categories with their aggregated activity times.
}

const ActivitiesByCategoryWidget = ({
  processedEvents: todayProcessedEvents,
  isLoadingEvents: isLoadingEventsProp,
  startDateMs,
  endDateMs,
  refetchEvents,
  selectedHour,
  onHourSelect
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
          description: `${variables.activityIdentifier} moved to ${targetCategoryName}.`
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

    const categoriesMap = new Map<string, SharedCategory>(
      (categories || []).map((cat: SharedCategory) => [cat._id, cat])
    )

    let processedCategoriesResult: ProcessedCategory[] = []

    if (todayProcessedEvents.length === 0) {
      processedCategoriesResult = (categories || [])
        .map((cat: SharedCategory) => ({
          id: cat._id,
          name: cat.name,
          color: cat.color,
          isProductive: cat.isProductive,
          totalDurationMs: 0,
          activities: []
        }))
        .sort((a, b) => {
          if (a.isProductive !== b.isProductive) {
            return a.isProductive ? -1 : 1
          }
          return 0
        })
    } else {
      processedCategoriesResult = processActivityEvents(todayProcessedEvents, categoriesMap)
    }

    const allCategoryIdsWithActivity = new Set(processedCategoriesResult.map((r) => r.id))
    const categoriesWithoutActivity = (categories || [])
      .filter((cat: SharedCategory) => !allCategoryIdsWithActivity.has(cat._id))
      .map((cat: SharedCategory) => ({
        id: cat._id,
        name: cat.name,
        color: cat.color,
        isProductive: cat.isProductive,
        totalDurationMs: 0,
        activities: []
      }))

    const finalResult = [...processedCategoriesResult, ...categoriesWithoutActivity].sort(
      (a, b) => {
        if (a.isProductive !== b.isProductive) {
          return a.isProductive ? -1 : 1
        }
        return b.totalDurationMs - a.totalDurationMs
      }
    )

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

  const renderActivityList = (
    activities: ActivityItem[],
    currentCategory: ProcessedCategory,
    allUserCategories: SharedCategory[] | undefined
  ) => {
    const oneMinuteMs = 60 * 1000
    const visibleActivities = activities.filter((act) => act.durationMs >= oneMinuteMs)
    const hiddenActivities = activities.filter((act) => act.durationMs < oneMinuteMs)
    const isShowMore = showMore[currentCategory.id]

    const renderItems = (items: ActivityItem[]) => {
      return items.map((activity) => {
        const activityKey = `${activity.identifier}-${activity.name}`
        const otherCategories =
          allUserCategories?.filter((cat) => cat._id !== currentCategory.id) || []
        const showMoveUI =
          (hoveredActivityKey === activityKey || openDropdownActivityKey === activityKey) &&
          otherCategories.length > 0

        return (
          <div
            key={activityKey}
            className="flex items-center justify-between py-0.5 group w-full hover:bg-muted rounded-md px-2"
            onMouseEnter={() => setHoveredActivityKey(activityKey)}
            onMouseLeave={() => setHoveredActivityKey(null)}
          >
            <div className="flex items-center flex-1 min-w-0">
              {activity.itemType === 'website' && activity.originalUrl ? (
                !faviconErrors.has(activity.identifier) ? (
                  <img
                    src={getFaviconURL(activity.originalUrl)}
                    alt={activity.identifier.charAt(0).toUpperCase()} // More descriptive alt
                    width={16}
                    height={16}
                    className="mr-2 flex-shrink-0 rounded"
                    onError={() => handleFaviconError(activity.identifier)}
                  />
                ) : (
                  <div className="w-4 h-4 flex items-center justify-center bg-muted text-muted-foreground rounded text-xs mr-2 flex-shrink-0">
                    {activity.identifier.charAt(0).toUpperCase()}
                  </div>
                )
              ) : activity.itemType === 'app' ? (
                <AppIcon appName={activity.identifier} size={16} className="mr-2 flex-shrink-0" />
              ) : (
                <span
                  className={`w-2 p-2 h-2 rounded-full mr-2 flex-shrink-0`}
                  style={{ backgroundColor: currentCategory.color }}
                ></span>
              )}
              <span
                className="text-sm text-foreground cursor-pointer block truncate"
                title={activity.name}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{activity.name}</span>
                    </TooltipTrigger>
                    <TooltipContent className="overflow-x-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                      {activity.name}
                      <br />
                      <ul>
                        <li>
                          <strong>Name:</strong> {activity.name}
                        </li>
                        <li>
                          <strong>Identifier:</strong> {activity.identifier}
                        </li>
                        {activity.originalUrl && (
                          <li className="whitespace-normal break-all">
                            <strong>URL:</strong> {activity.originalUrl}
                          </li>
                        )}
                        <li>
                          <strong>Type:</strong> {activity.itemType}
                        </li>
                        <li>
                          <strong>Duration:</strong> {formatDuration(activity.durationMs)}
                        </li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
            </div>
            <div className="flex items-center flex-shrink-0 ml-2">
              {showMoveUI && (
                <>
                  {otherCategories.length === 1 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 px-2 py-1 text-xs"
                      onClick={() => handleMoveActivity(activity, otherCategories[0]._id)}
                      disabled={updateCategoryMutation.isLoading}
                    >
                      {updateCategoryMutation.isLoading
                        ? 'Moving...'
                        : `Move: ${otherCategories[0].name.substring(0, 10)}${otherCategories[0].name.length > 10 ? '...' : ''}`}
                    </Button>
                  ) : (
                    <DropdownMenu
                      open={openDropdownActivityKey === activityKey}
                      onOpenChange={(isOpen) => {
                        setOpenDropdownActivityKey(isOpen ? activityKey : null)
                        // If closing, also clear hover to prevent immediate re-show if mouse is still over row
                        if (!isOpen) {
                          setHoveredActivityKey(null)
                        }
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-5 px-2 py-1 text-xs">
                          Move to...
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
                        {otherCategories.map((targetCat) => (
                          <DropdownMenuItem
                            key={targetCat._id}
                            onClick={() => {
                              handleMoveActivity(activity, targetCat._id)
                            }}
                            disabled={updateCategoryMutation.isLoading}
                          >
                            {targetCat.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
              {!showMoveUI && (
                <span className="text-sm text-muted-foreground">
                  {formatDuration(activity.durationMs)}
                </span>
              )}
            </div>
          </div>
        )
      })
    }

    return (
      <>
        {renderItems(visibleActivities)}
        {hiddenActivities.length > 0 && (
          <div className="px-2 pt-1">
            <Button
              variant="link"
              className="p-0 h-auto text-xs text-muted-foreground"
              onClick={() =>
                setShowMore((prev) => ({ ...prev, [currentCategory.id]: !isShowMore }))
              }
            >
              {isShowMore ? 'Show less' : `Show ${hiddenActivities.length} more`}
            </Button>
          </div>
        )}
        {isShowMore && renderItems(hiddenActivities)}
      </>
    )
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
                <div className="flex ml-2 justify-between items-center mb-1 pb-1 border-b border-border">
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
                {renderActivityList(category.activities, category, categories)}
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 px-2 pt-2">
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
        {processedData.map((category) => {
          if (
            category.totalDurationMs === 0 &&
            (!todayProcessedEvents || todayProcessedEvents.length === 0)
          ) {
            return null // If no events at all for the day, and category is empty, skip it.
          }

          return (
            <div key={category.id}>
              <div className="flex ml-2 justify-between items-center mb-1 pb-1 border-b border-border">
                <div className="flex items-center">
                  <span
                    className="w-4 h-4 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  ></span>
                  <h3 className="text-md font-semibold text-muted-foreground">{category.name}</h3>
                </div>
                <span className="text-md font-semibold text-foreground">
                  {formatDuration(category.totalDurationMs)}
                </span>
              </div>
              {renderActivityList(category.activities, category, categories)}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default React.memo(ActivitiesByCategoryWidget)
