export interface TimeBlock {
  _id?: string
  startTime: Date
  endTime: Date
  durationMs: number
  name: string
  description: string
  url?: string
  categoryColor?: string
  categoryId?: string
  type: 'window' | 'browser' | 'system' | 'manual'
  originalEvent?: any
}

export const SLOT_DURATION_MINUTES = 10 // The duration of each time slot in minutes, was 5

interface TimelineSlot {
  startMinute: number
  endMinute: number
  mainActivity: TimeBlock | null
  allActivities: Record<string, { duration: number; block: TimeBlock }>
}

export interface EnrichedTimelineSegment extends TimeBlock {
  _id?: string
  startMinute: number
  endMinute: number
  heightPercentage: number
  topPercentage: number
  allActivities: Record<string, { duration: number; block: TimeBlock }>
  type: 'window' | 'browser' | 'system' | 'manual'
}

const BROWSER_NAMES = ['Google Chrome', 'Safari', 'Firefox', 'Microsoft Edge', 'Arc']

function createTimelineSlots(timeBlocks: TimeBlock[], hourStart: Date): TimelineSlot[] {
  const slots: TimelineSlot[] = []
  const slotsPerHour = 60 / SLOT_DURATION_MINUTES

  for (let i = 0; i < slotsPerHour; i++) {
    const slotStart = new Date(hourStart.getTime() + i * SLOT_DURATION_MINUTES * 60 * 1000)
    const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000)
    const activitiesInSlot: Record<string, { duration: number; block: TimeBlock }> = {}

    timeBlocks.forEach((block) => {
      const blockStart = block.startTime
      const blockEnd = block.endTime

      const overlapStart = new Date(Math.max(blockStart.getTime(), slotStart.getTime()))
      const overlapEnd = new Date(Math.min(blockEnd.getTime(), slotEnd.getTime()))
      const duration = overlapEnd.getTime() - overlapStart.getTime()

      if (duration > 0) {
        const groupingKey =
          BROWSER_NAMES.includes(block.name) && block.description ? block.description : block.name
        if (!activitiesInSlot[groupingKey]) {
          activitiesInSlot[groupingKey] = { duration: 0, block }
        }
        activitiesInSlot[groupingKey].duration += duration
      }
    })

    const [mainActivityKey, mainActivityData] = Object.entries(activitiesInSlot).reduce(
      (max, current) => (current[1].duration > max[1].duration ? current : max),
      ['', { duration: 0, block: null as TimeBlock | null }]
    )

    const displayBlock = mainActivityData.block
      ? { ...mainActivityData.block, name: mainActivityKey }
      : null

    slots.push({
      startMinute: i * SLOT_DURATION_MINUTES,
      endMinute: (i + 1) * SLOT_DURATION_MINUTES,
      mainActivity: displayBlock,
      allActivities: activitiesInSlot
    })
  }
  return slots
}

function mergeConsecutiveSlots(slots: TimelineSlot[]): (TimelineSlot & { durationMs: number })[] {
  if (slots.length === 0) {
    return []
  }
  const mergedSlots: (TimelineSlot & { durationMs: number })[] = []
  let currentMergedSlot: TimelineSlot & { durationMs: number } = {
    ...slots[0],
    durationMs: slots[0].mainActivity ? SLOT_DURATION_MINUTES * 60 * 1000 : 0
  }

  for (let i = 1; i < slots.length; i++) {
    const slot = slots[i]
    if (
      slot.mainActivity &&
      currentMergedSlot.mainActivity &&
      slot.mainActivity.name === currentMergedSlot.mainActivity.name &&
      slot.mainActivity.categoryColor === currentMergedSlot.mainActivity.categoryColor
    ) {
      currentMergedSlot.endMinute = slot.endMinute
      currentMergedSlot.durationMs += SLOT_DURATION_MINUTES * 60 * 1000
      Object.entries(slot.allActivities).forEach(([key, data]) => {
        if (currentMergedSlot.allActivities[key]) {
          currentMergedSlot.allActivities[key].duration += data.duration
        } else {
          currentMergedSlot.allActivities[key] = data
        }
      })
    } else {
      mergedSlots.push(currentMergedSlot)
      currentMergedSlot = {
        ...slot,
        durationMs: slot.mainActivity ? SLOT_DURATION_MINUTES * 60 * 1000 : 0
      }
    }
  }
  mergedSlots.push(currentMergedSlot)
  return mergedSlots
}

function convertSlotsToSegments(
  mergedSlots: (TimelineSlot & { durationMs: number })[]
): EnrichedTimelineSegment[] {
  return mergedSlots
    .filter((slot) => slot.mainActivity)
    .map((slot) => {
      const block = slot.mainActivity!
      const heightPercentage = ((slot.endMinute - slot.startMinute) / 60) * 100
      const topPercentage = (slot.startMinute / 60) * 100

      return {
        ...block,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
        heightPercentage,
        topPercentage,
        allActivities: slot.allActivities
      }
    })
}

export const getTimelineSegmentsForHour = (
  hour: number,
  timeBlocks: TimeBlock[]
): EnrichedTimelineSegment[] => {
  if (timeBlocks.length === 0) {
    return []
  }
  const referenceDate = new Date(timeBlocks[0].startTime)
  const hourStart = new Date(referenceDate)
  hourStart.setHours(hour, 0, 0, 0)

  const slots = createTimelineSlots(timeBlocks, hourStart)

  const mergedSlots = mergeConsecutiveSlots(slots)
  const segments = convertSlotsToSegments(mergedSlots)

  return segments
}

export const convertYToTime = (
  y: number,
  timelineContainer: HTMLDivElement,
  hourHeight: number
) => {
  const containerRect = timelineContainer.getBoundingClientRect()
  const relativeY = y - containerRect.top

  const hourHeightInRem = hourHeight
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
  const hourHeightInPx = hourHeightInRem * rootFontSize

  // Account for the pt-1.5 (6px) padding at the top of each hour
  const paddingTopPx = 6
  const effectiveHourHeight = hourHeightInPx - paddingTopPx
  const totalHeight = 24 * hourHeightInPx

  const clampedY = Math.max(0, Math.min(relativeY, totalHeight))

  const hour = Math.floor(clampedY / hourHeightInPx)

  // Adjust for the padding within the hour
  const yWithinHour = clampedY % hourHeightInPx
  const adjustedYWithinHour = Math.max(0, yWithinHour - paddingTopPx)
  const minuteFraction = adjustedYWithinHour / effectiveHourHeight
  const minute = Math.floor(minuteFraction * 60)

  // Snap to 5-minute intervals - use floor to snap to the start of the interval
  let snappedMinute = Math.floor(minute / 5) * 5
  let finalHour = hour

  if (snappedMinute === 60) {
    finalHour += 1
    snappedMinute = 0
  }

  // Recalculate the y position based on the snapped time for visual snapping
  const snappedYPosition =
    finalHour * hourHeightInPx + paddingTopPx + (snappedMinute / 60) * effectiveHourHeight

  return { hour: finalHour, minute: snappedMinute, y: snappedYPosition }
}
