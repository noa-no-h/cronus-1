import { extractWebsiteInfo, formatDuration } from '@renderer/lib/activityByCategoryWidgetHelpers'
import { useEffect, useState } from 'react'
import { ActiveWindowEvent, Category as SharedCategory } from 'shared' // Make sure Category is correctly typed and imported
import { useAuth } from '../contexts/AuthContext'
import { getFaviconURL } from '../utils/favicon' // Added for favicons
import { trpc } from '../utils/trpc'
import AppIcon from './AppIcon' // Added for app icons
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

// Max duration for a single event interval. Influenced by 5-min periodic backup
// in native code (activeWindowObserver.mm) to correctly handle last event duration.
const MAX_SINGLE_EVENT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
interface ActivityItem {
  name: string // Display name (app name or website title)
  durationMs: number
  itemType: 'app' | 'website'
  identifier: string // app ownerName or website domain
  originalUrl?: string // URL for website favicons
}

interface ProcessedCategory {
  id: string
  name: string // Actual category name like "Coding", "Social Media"
  color: string
  isProductive: boolean
  totalDurationMs: number
  activities: ActivityItem[]
}

// Helper function to extract website info
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
    event.ownerName.toLowerCase().includes('google chrome') &&
    event.title &&
    event.title.trim() !== ''
  ) {
    // Case 2: Event is from Google Chrome, has no URL, but has a usable title.
    // Treat this as a web-like activity, using the title as its name and identifier.
    activityName = event.title.trim()
    itemType = 'website' // Or 'chrome_tab' or similar if you want to distinguish further
    identifier = event.title.trim() // Using title as identifier; might need cleaning for consistency
    // originalUrl remains undefined here
    // console.log('Google Chrome event with TITLE but no URL (classified as website via title):', event);
  } else {
    // Case 3: Fallback - treated as a generic app.
    // This will catch non-Chrome apps, or Chrome instances with no URL and no title.
    // console.log('Event classified as generic app:', event); // General log for non-website events
  }
  return { activityName, itemType, identifier, originalUrl }
}

const processActivityEvents = (
  sortedEvents: (ActiveWindowEvent & { timestamp: number })[],
  categoriesMap: Map<string, SharedCategory>
): ProcessedCategory[] => {
  // This accumulator will hold activities grouped by their category ID.
  // For each category, it stores the category's details and a map of its activities.
  // The inner 'activitiesMap' maps an activity's display name to its full ActivityItem details (duration, type, etc.).
  const categoryActivityAccumulator: Record<
    string, // categoryId
    { categoryDetails: SharedCategory; activitiesMap: Map<string, ActivityItem> }
  > = {}

  // Iterate through events
  for (let i = 0; i < sortedEvents.length; i++) {
    const currentEvent = sortedEvents[i]

    const categoryId = currentEvent.categoryId
    if (!categoryId) continue // Skip events not assigned to a category

    const categoryDetails = categoriesMap.get(categoryId)
    if (!categoryDetails) {
      // console.warn(`Category details not found for categoryId: ${categoryId}. Skipping event.`);
      continue
    }

    // Calculate duration: time until the next event, or until Date.now() for the last event in the array.
    // A periodic backup event is sent every 5 minutes from the native side, so intermediate durations should be low.
    // This cap primarily affects the duration calculation for the *last* event if the app has been idle/closed
    // for a while, preventing an overly long duration from being assigned to it.
    let durationMs = 0
    if (i < sortedEvents.length - 1) {
      durationMs = sortedEvents[i + 1].timestamp - currentEvent.timestamp
    } else {
      durationMs = Date.now() - currentEvent.timestamp
    }
    durationMs = Math.max(0, Math.min(durationMs, MAX_SINGLE_EVENT_DURATION_MS))
    if (durationMs === 0) continue // Skip if duration is negligible

    // Extract display name, type (app/website), identifier (app name/domain), and URL for the current activity.
    const { activityName, itemType, identifier, originalUrl } =
      extractActivityDetailsFromEvent(currentEvent)

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

const ActivitiesByCategoryWidget = () => {
  const { token } = useAuth()
  const [processedData, setProcessedData] = useState<ProcessedCategory[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [faviconErrors, setFaviconErrors] = useState<Set<string>>(new Set()) // Added for favicon error handling

  const { data: categoriesData, isLoading: isLoadingCategories } =
    trpc.category.getCategories.useQuery({ token: token || '' }, { enabled: !!token })
  const categories = categoriesData as SharedCategory[] | undefined

  const { data: todayEventsData, isLoading: isLoadingEvents } =
    trpc.activeWindowEvents.getTodayEvents.useQuery(
      { token: token || '' },
      { enabled: !!token, refetchInterval: 60000 }
    )
  const todayEvents = todayEventsData as ActiveWindowEvent[] | undefined

  useEffect(() => {
    if (isLoadingCategories || isLoadingEvents) {
      setIsLoadingData(true)
      return
    }

    if (!categories || !todayEvents) {
      setIsLoadingData(false)
      setProcessedData([])
      return
    }

    const categoriesMap = new Map<string, SharedCategory>(
      (categories || []).map((cat: SharedCategory) => [cat._id, cat])
    )

    const sortedEvents = [...(todayEvents || [])]
      .filter((event) => typeof event.timestamp === 'number')
      .sort((a, b) => (a.timestamp as number) - (b.timestamp as number)) as (ActiveWindowEvent & {
      timestamp: number
    })[]

    let processedCategoriesResult: ProcessedCategory[] = []

    if (sortedEvents.length === 0) {
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
      processedCategoriesResult = processActivityEvents(sortedEvents, categoriesMap)
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
    setIsLoadingData(false)
  }, [categories, todayEvents, isLoadingCategories, isLoadingEvents])

  const handleFaviconError = (identifier: string): void => {
    setFaviconErrors((prev) => new Set(prev).add(identifier))
  }

  const renderActivityList = (
    activities: ActivityItem[],
    isProductive: boolean | null | undefined // Keep for potential fallback dot color, though primary is icon
  ) => {
    let dotColorClass = 'bg-yellow-500' // Neutral default
    if (isProductive === true) dotColorClass = 'bg-blue-500'
    else if (isProductive === false) dotColorClass = 'bg-red-500'

    return activities.map((activity) => (
      <div
        key={`${activity.identifier}-${activity.name}`}
        className="flex items-center justify-between ml-4 py-0.5"
      >
        <div className="flex items-center min-w-0">
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
            <span className={`w-2 p-2 h-2 rounded-full mr-2 flex-shrink-0 ${dotColorClass}`}></span>
          )}
          <span className="text-sm text-foreground truncate" title={activity.name}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{activity.name}</span>
                </TooltipTrigger>
                <TooltipContent>{JSON.stringify(activity)}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
        </div>
        <span className="text-sm text-muted-foreground flex-shrink-0 ml-2">
          {formatDuration(activity.durationMs)}
        </span>
      </div>
    ))
  }

  if (isLoadingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading activity data...</p>
        </CardContent>
      </Card>
    )
  }

  if (processedData.every((p) => p.totalDurationMs === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Daily Activity Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 space-y-4">
          {processedData.map((category) => {
            if (category.totalDurationMs === 0) return null // Don't render categories with no time

            return (
              <div key={category.id}>
                <div className="flex justify-between items-center mb-1 pb-1 border-b border-border">
                  <h3 className="text-md font-semibold" style={{ color: category.color }}>
                    {category.name.toUpperCase()}
                  </h3>
                  <span className="text-md font-semibold text-foreground">
                    {formatDuration(category.totalDurationMs)}
                  </span>
                </div>
                {renderActivityList(category.activities, category.isProductive)}
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Daily Activity Summary</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        {processedData.map((category) => {
          if (category.totalDurationMs === 0) return null // Don't render categories with no time

          return (
            <div key={category.id}>
              <div className="flex justify-between items-center mb-1 pb-1 border-b border-border">
                <h3 className="text-md font-semibold" style={{ color: category.color }}>
                  {category.name.toUpperCase()}
                </h3>
                <span className="text-md font-semibold text-foreground">
                  {formatDuration(category.totalDurationMs)}
                </span>
              </div>
              {renderActivityList(category.activities, category.isProductive)}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default ActivitiesByCategoryWidget
