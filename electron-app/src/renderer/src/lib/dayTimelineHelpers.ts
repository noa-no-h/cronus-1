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

export interface DaySegment extends EnrichedTimelineSegment {
  top: number
  height: number
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
  const manualEntries: DaySegment[] = []
  const otherBlocks: TimeBlock[] = []

  timeBlocks.forEach((block) => {
    if (block.type === 'manual') {
      const startOfDay = new Date(block.startTime)
      startOfDay.setHours(0, 0, 0, 0)
      const startMinutes = (block.startTime.getTime() - startOfDay.getTime()) / (1000 * 60)
      const durationMinutes = block.durationMs / (1000 * 60)
      const top = (startMinutes / totalMinutesInDay) * timelineHeight
      const height = (durationMinutes / totalMinutesInDay) * timelineHeight

      manualEntries.push({
        ...block,
        startMinute: startMinutes,
        endMinute: startMinutes + durationMinutes,
        topPercentage: (startMinutes / totalMinutesInDay) * 100,
        heightPercentage: (durationMinutes / totalMinutesInDay) * 100,
        allActivities: { [block.name]: { duration: block.durationMs, block } },
        top,
        height
      })
    } else {
      otherBlocks.push(block)
    }
  })

  if (otherBlocks.length === 0) {
    return manualEntries
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
    const activitiesInSlot: Record<string, { duration: number; block: TimeBlock }> = {}

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

      return {
        ...block,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
        heightPercentage: (durationMinutes / totalMinutesInDay) * 100,
        topPercentage: (startMinutes / totalMinutesInDay) * 100,
        allActivities: slot.allActivities,
        top,
        height,
        durationMs: durationMinutes * 60 * 1000
      }
    })

  const finalSegments = [...aggregatedSegments, ...manualEntries].sort((a, b) => a.top - b.top)

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
        const originalHeight = lastSegment.height
        const originalEndMinute = lastSegment.endMinute

        lastSegment.endMinute = currentMinutes
        const durationMinutes = lastSegment.endMinute - lastSegment.startMinute
        lastSegment.height = (durationMinutes / totalMinutesInDay) * timelineHeight

        // console.log('ADJUSTED SEGMENT', {
        //   name: lastSegment.name,
        //   originalEndMinute,
        //   newEndMinute: lastSegment.endMinute,
        //   originalHeight,
        //   newHeight: lastSegment.height
        // })
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
