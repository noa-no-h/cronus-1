import { ActiveWindowEvent, Category } from 'shared'
import { SYSTEM_EVENT_NAMES } from '../lib/constants'

const MAX_GAP_BETWEEN_EVENTS_MS = 5 * 60 * 1000

interface ProductivityMetrics {
  dailyProductiveMs: number
  dailyUnproductiveMs: number
}

export function calculateProductivityMetrics(
  events: ActiveWindowEvent[],
  categories: Category[]
): ProductivityMetrics {
  let dailyProductiveMs = 0
  let dailyUnproductiveMs = 0

  if (!events || !categories || events.length === 0 || categories.length === 0) {
    return { dailyProductiveMs, dailyUnproductiveMs }
  }

  const categoriesMap = new Map(categories.map((cat) => [cat._id, cat]))
  const sortedEvents = [...events].sort((a, b) => (a.timestamp as number) - (b.timestamp as number))

  for (let i = 0; i < sortedEvents.length; i++) {
    const currentEvent = sortedEvents[i]
    if (!currentEvent.timestamp || SYSTEM_EVENT_NAMES.includes(currentEvent.ownerName)) {
      continue
    }

    const eventCategory = currentEvent.categoryId
      ? categoriesMap.get(currentEvent.categoryId)
      : null
    if (!eventCategory) {
      continue
    }

    let durationMs = 0
    if (i < sortedEvents.length - 1) {
      const nextEvent = sortedEvents[i + 1]
      const nextEventTimestamp = (nextEvent.timestamp as number) || 0
      durationMs = nextEventTimestamp - (currentEvent.timestamp as number)

      if (durationMs > MAX_GAP_BETWEEN_EVENTS_MS) {
        durationMs = MAX_GAP_BETWEEN_EVENTS_MS
      }
    } else {
      durationMs = Date.now() - (currentEvent.timestamp as number)
      if (durationMs > MAX_GAP_BETWEEN_EVENTS_MS) {
        durationMs = MAX_GAP_BETWEEN_EVENTS_MS
      }
    }

    durationMs = Math.max(0, durationMs)
    if (durationMs > 0) {
      if (eventCategory.isProductive) {
        dailyProductiveMs += durationMs
      } else {
        dailyUnproductiveMs += durationMs
      }
    }
  }

  return { dailyProductiveMs, dailyUnproductiveMs }
}
