import { ActiveWindowEvent, Category as SharedCategory } from 'shared'
import type { ProcessedEventBlock } from '../components/DashboardView'
import { extractWebsiteInfo } from './activityByCategoryWidgetHelpers'

export interface ActivityItem {
  name: string
  durationMs: number
  itemType: 'app' | 'website'
  identifier: string
  originalUrl?: string
}

export interface ProcessedCategory {
  id: string
  name: string
  color: string
  isProductive: boolean
  totalDurationMs: number
  activities: ActivityItem[]
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

export const processActivityEvents = (
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
