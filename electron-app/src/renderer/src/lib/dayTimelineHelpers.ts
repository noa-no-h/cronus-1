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
  categoryName?: string
  type: 'window' | 'browser' | 'system' | 'manual' | 'calendar'
  originalEvent?: any
  originalEventIds?: string[] // Track all original event IDs that contributed to this block
  isSuggestion?: boolean
  onAccept?: (e: React.MouseEvent) => void
  onReject?: (e: React.MouseEvent) => void
}

export interface ActivityBlock {
  duration: number
  block: TimeBlock
  eventIds?: string[] // Track event IDs that contributed to this activity
}

export const SLOT_DURATION_MINUTES = 10 // The duration of each time slot in minutes, was 5

interface TimelineSlot {
  startMinute: number
  endMinute: number
  mainActivity: TimeBlock | null
  allActivities: Record<string, ActivityBlock>
}

export interface EnrichedTimelineSegment extends TimeBlock {
  _id?: string
  startMinute: number
  endMinute: number
  heightPercentage: number
  topPercentage: number
  allActivities: Record<string, ActivityBlock>
  type: 'window' | 'browser' | 'system' | 'manual' | 'calendar'
}

export interface DaySegment extends EnrichedTimelineSegment {
  top: number
  height: number
  categoryName?: string
  isSuggestion?: boolean
  groupedEvents?: DaySegment[]
}

const BROWSER_NAMES = ['Google Chrome', 'Safari', 'Firefox', 'Microsoft Edge', 'Arc']

function createTimelineSlots(timeBlocks: TimeBlock[], hourStart: Date): TimelineSlot[] {
  const slots: TimelineSlot[] = []
  const slotsPerHour = 60 / SLOT_DURATION_MINUTES

  for (let i = 0; i < slotsPerHour; i++) {
    const slotStart = new Date(hourStart.getTime() + i * SLOT_DURATION_MINUTES * 60 * 1000)
    const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000)
    const activitiesInSlot: Record<string, ActivityBlock> = {}

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
          activitiesInSlot[groupingKey] = {
            duration: 0,
            block,
            eventIds: block.originalEventIds
              ? [...block.originalEventIds]
              : block._id
                ? [block._id]
                : []
          }
        } else {
          // Merge event IDs when adding to existing activity
          const existingEventIds = activitiesInSlot[groupingKey].eventIds || []
          const newEventIds = block.originalEventIds
            ? [...block.originalEventIds]
            : block._id
              ? [block._id]
              : []
          activitiesInSlot[groupingKey].eventIds = [
            ...new Set([...existingEventIds, ...newEventIds])
          ]
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
          // Merge event IDs
          const existingEventIds = currentMergedSlot.allActivities[key].eventIds || []
          const newEventIds = data.eventIds || []
          currentMergedSlot.allActivities[key].eventIds = [
            ...new Set([...existingEventIds, ...newEventIds])
          ]
        } else {
          currentMergedSlot.allActivities[key] = {
            ...data,
            eventIds: data.eventIds ? [...data.eventIds] : []
          }
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

function groupOverlappingCalendarSegments(calendarSegments: DaySegment[]): DaySegment[] {
  if (calendarSegments.length === 0) {
    return []
  }

  // Sort by start time
  const sortedSegments = [...calendarSegments].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  )

  const groups: DaySegment[][] = []
  let currentGroup: DaySegment[] = [sortedSegments[0]]

  for (let i = 1; i < sortedSegments.length; i++) {
    const lastEventInGroup = currentGroup[currentGroup.length - 1]
    const currentEvent = sortedSegments[i]

    // Check for overlap with the last event in the group.
    // Since they are sorted by start time, we only need to check against the last one.
    if (currentEvent.startTime.getTime() < lastEventInGroup.endTime.getTime()) {
      currentGroup.push(currentEvent)
    } else {
      groups.push(currentGroup)
      currentGroup = [currentEvent]
    }
  }
  groups.push(currentGroup)

  return groups.map((group) => {
    if (group.length === 1) {
      return group[0]
    }

    const firstEvent = group[0]
    const lastEvent = group[group.length - 1]

    const groupStartTime = firstEvent.startTime
    const groupEndTime = new Date(Math.max(...group.map((e) => e.endTime.getTime())))

    const totalMinutesInDay = 24 * 60
    const startOfDay = new Date(groupStartTime)
    startOfDay.setHours(0, 0, 0, 0)

    const startMinutes = (groupStartTime.getTime() - startOfDay.getTime()) / (1000 * 60)
    const durationMinutes = (groupEndTime.getTime() - groupStartTime.getTime()) / (1000 * 60)

    const timelineHeight = firstEvent.top / (firstEvent.topPercentage / 100)

    const top = (startMinutes / totalMinutesInDay) * timelineHeight
    const height = (durationMinutes / totalMinutesInDay) * timelineHeight

    return {
      ...firstEvent, // Use first event as a base
      name: `${group.length} overlapping events`,
      startTime: groupStartTime,
      endTime: groupEndTime,
      durationMs: groupEndTime.getTime() - groupStartTime.getTime(),
      top,
      height,
      startMinute: startMinutes,
      endMinute: startMinutes + durationMinutes,
      topPercentage: (startMinutes / totalMinutesInDay) * 100,
      heightPercentage: (durationMinutes / totalMinutesInDay) * 100,
      groupedEvents: group
    }
  })
}

export function getTimelineSegmentsForDay(
  timeBlocks: TimeBlock[],
  timelineHeight: number,
  isToday = false,
  currentTime: Date | null = null
): DaySegment[] {
  if (timeBlocks.length === 0 || timelineHeight === 0) {
    return []
  }

  const totalMinutesInDay = 24 * 60

  // We need to process manual entries separately to ensure they render as single blocks
  const nonAggregatedSegments: DaySegment[] = []
  const otherBlocks: TimeBlock[] = []
  const calendarBlocks: TimeBlock[] = []

  timeBlocks.forEach((block) => {
    if (block.type === 'manual') {
      const startOfDay = new Date(block.startTime)
      startOfDay.setHours(0, 0, 0, 0)
      const startMinutes = (block.startTime.getTime() - startOfDay.getTime()) / (1000 * 60)
      const durationMinutes = block.durationMs / (1000 * 60)
      const top = (startMinutes / totalMinutesInDay) * timelineHeight
      const height = (durationMinutes / totalMinutesInDay) * timelineHeight

      nonAggregatedSegments.push({
        ...block,
        startMinute: startMinutes,
        endMinute: startMinutes + durationMinutes,
        topPercentage: (startMinutes / totalMinutesInDay) * 100,
        heightPercentage: (durationMinutes / totalMinutesInDay) * 100,
        allActivities: { [block.name]: { duration: block.durationMs, block } },
        top,
        height,
        isSuggestion: block.isSuggestion
      })
    } else if (block.type === 'calendar') {
      calendarBlocks.push(block)
    } else {
      otherBlocks.push(block)
    }
  })

  let calendarSegments: DaySegment[] = calendarBlocks.map((block) => {
    const startOfDay = new Date(block.startTime)
    startOfDay.setHours(0, 0, 0, 0)
    const startMinutes = (block.startTime.getTime() - startOfDay.getTime()) / (1000 * 60)
    const durationMinutes = block.durationMs / (1000 * 60)
    const top = (startMinutes / totalMinutesInDay) * timelineHeight
    const height = (durationMinutes / totalMinutesInDay) * timelineHeight
    return {
      ...block,
      startMinute: startMinutes,
      endMinute: startMinutes + durationMinutes,
      topPercentage: (startMinutes / totalMinutesInDay) * 100,
      heightPercentage: (durationMinutes / totalMinutesInDay) * 100,
      allActivities: { [block.name]: { duration: block.durationMs, block } },
      top,
      height,
      isSuggestion: block.isSuggestion
    }
  })

  calendarSegments = groupOverlappingCalendarSegments(calendarSegments)

  if (otherBlocks.length === 0) {
    return [...nonAggregatedSegments, ...calendarSegments].sort((a, b) => a.top - b.top)
  }

  // Step 1: Create slots for the entire day for non-manual blocks
  const slots: TimelineSlot[] = []
  const slotsInDay = 24 * (60 / SLOT_DURATION_MINUTES)
  const referenceDate = new Date(otherBlocks[0].startTime)
  const dayStart = new Date(referenceDate)
  dayStart.setHours(0, 0, 0, 0)

  for (let i = 0; i < slotsInDay; i++) {
    const slotStart = new Date(dayStart.getTime() + i * SLOT_DURATION_MINUTES * 60 * 1000)
    const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000)
    const activitiesInSlot: Record<string, ActivityBlock> = {}

    otherBlocks.forEach((block) => {
      const blockStart = block.startTime
      const blockEnd = block.endTime

      const overlapStart = new Date(Math.max(blockStart.getTime(), slotStart.getTime()))
      const overlapEnd = new Date(Math.min(blockEnd.getTime(), slotEnd.getTime()))
      const duration = overlapEnd.getTime() - overlapStart.getTime()

      if (duration > 0) {
        const groupingKey =
          BROWSER_NAMES.includes(block.name) && block.description ? block.description : block.name
        if (!activitiesInSlot[groupingKey]) {
          activitiesInSlot[groupingKey] = {
            duration: 0,
            block,
            eventIds: block.originalEventIds
              ? [...block.originalEventIds]
              : block._id
                ? [block._id]
                : []
          }
        } else {
          // Merge event IDs when adding to existing activity
          const existingEventIds = activitiesInSlot[groupingKey].eventIds || []
          const newEventIds = block.originalEventIds
            ? [...block.originalEventIds]
            : block._id
              ? [block._id]
              : []
          activitiesInSlot[groupingKey].eventIds = [
            ...new Set([...existingEventIds, ...newEventIds])
          ]
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

  // Step 2: Merge consecutive slots
  const mergedSlots = mergeConsecutiveSlots(slots)

  // Step 3: Convert merged slots to day segments

  const aggregatedSegments: DaySegment[] = mergedSlots
    .filter((slot) => slot.mainActivity)
    .map((slot) => {
      const block = slot.mainActivity!
      const startMinutes = slot.startMinute
      const durationMinutes = slot.endMinute - slot.startMinute

      const top = (startMinutes / totalMinutesInDay) * timelineHeight
      const height = (durationMinutes / totalMinutesInDay) * timelineHeight

      // Create correct start/end times for the aggregated segment
      const startTime = new Date(dayStart.getTime() + startMinutes * 60000)
      const endTime = new Date(dayStart.getTime() + (startMinutes + durationMinutes) * 60000)

      // Collect all event IDs from all activities in this slot
      const allEventIds: string[] = []
      Object.values(slot.allActivities).forEach((activity) => {
        if (activity.eventIds) {
          allEventIds.push(...activity.eventIds)
        }
      })
      const uniqueEventIds = [...new Set(allEventIds)]

      return {
        ...block,
        // override the start and end times to be the correct start and end times for the aggregated segment
        startTime,
        endTime,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
        heightPercentage: (durationMinutes / totalMinutesInDay) * 100,
        topPercentage: (startMinutes / totalMinutesInDay) * 100,
        allActivities: slot.allActivities,
        originalEventIds: uniqueEventIds,
        top,
        height,
        durationMs: durationMinutes * 60 * 1000,
        isSuggestion: block.isSuggestion
      }
    })

  const finalSegments = [...aggregatedSegments, ...nonAggregatedSegments, ...calendarSegments].sort(
    (a, b) => a.top - b.top
  )

  if (isToday && currentTime && finalSegments.length > 0) {
    const lastSegment = finalSegments[finalSegments.length - 1]

    // Only adjust non-manual entries, as they are not slotted and should have correct end times.
    if (lastSegment.type !== 'manual') {
      const totalMinutesInDay = 24 * 60
      const currentMinutes =
        currentTime.getHours() * 60 + currentTime.getMinutes() + currentTime.getSeconds() / 60

      // If the last segment from slots extends beyond the current time, truncate it.
      // This prevents the "current activity" block from showing as longer than it is.
      if (lastSegment.startMinute < currentMinutes && lastSegment.endMinute > currentMinutes) {
        lastSegment.endMinute = currentMinutes
        const durationMinutes = lastSegment.endMinute - lastSegment.startMinute
        lastSegment.height = (durationMinutes / totalMinutesInDay) * timelineHeight
      }
    }
  }

  return finalSegments
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
  const rect = timelineContainer.getBoundingClientRect()
  const relativeY = y // y is already relative

  const totalMinutesInDay = 24 * 60
  const timelineHeight = timelineContainer.offsetHeight

  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)

  // Clamp y to be within the timeline bounds
  const clampedY = Math.max(0, Math.min(relativeY, timelineHeight))

  const minutesFromTop = (clampedY / timelineHeight) * totalMinutesInDay
  const hour = Math.floor(minutesFromTop / 60)
  const minute = Math.floor(minutesFromTop % 60)

  // Snap to the nearest 5-minute interval
  let snappedMinute = Math.round(minute / 5) * 5
  let finalHour = hour

  if (snappedMinute === 60) {
    finalHour += 1
    snappedMinute = 0
  }

  // Recalculate the y position based on the snapped time for visual snapping
  const snappedMinutesFromTop = finalHour * 60 + snappedMinute
  const snappedYPosition = (snappedMinutesFromTop / totalMinutesInDay) * timelineHeight

  return { hour: finalHour, minute: snappedMinute, y: snappedYPosition }
}
