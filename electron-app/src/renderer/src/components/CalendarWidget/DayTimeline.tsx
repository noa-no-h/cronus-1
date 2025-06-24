import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTimeSelection } from '../../hooks/useTimeSelection'
import {
  getTimelineSegmentsForHour,
  type EnrichedTimelineSegment,
  type TimeBlock
} from '../../lib/dayTimelineHelpers'
import { trpc } from '../../utils/trpc'
import { TooltipProvider } from '../ui/tooltip'
import { CreateEntryModal } from './CreateEntryModal'
import { CurrentTimeIndicator } from './CurrentTimeIndicator'
import { SelectionBox } from './SelectionBox'
import { TimelineHour } from './TimelineHour'

export type { TimeBlock }

interface DayTimelineProps {
  timeBlocks: TimeBlock[]
  currentTime: Date
  isToday: boolean
  isDarkMode: boolean
  selectedHour: number | null
  onHourSelect: (hour: number | null) => void
  hourHeight: number
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}

const DayTimeline = ({
  timeBlocks,
  currentTime,
  isToday,
  isDarkMode,
  selectedHour,
  onHourSelect,
  hourHeight,
  scrollContainerRef
}: DayTimelineProps) => {
  const currentHourRef = useRef<HTMLDivElement>(null)
  const prevHourHeightRef = useRef(hourHeight)
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  const { token } = useAuth()
  const utils = trpc.useUtils()

  const createManualEntry = trpc.activeWindowEvents.createManual.useMutation({
    onSuccess: () => {
      // After a successful mutation, invalidate the query for the current day
      utils.activeWindowEvents.getEventsForDateRange.invalidate()
    },
    onError: (error) => {
      // Basic error handling
      console.error('Failed to create manual entry:', error)
      alert('Error: Could not create the entry. Please try again.')
    }
  })

  const updateManualEntry = trpc.activeWindowEvents.updateManual.useMutation({
    onSuccess: () => {
      utils.activeWindowEvents.getEventsForDateRange.invalidate()
    },
    onError: (error) => {
      console.error('Failed to update manual entry:', error)
      alert('Error: Could not update the entry. Please try again.')
    }
  })

  const deleteManualEntry = trpc.activeWindowEvents.deleteManual.useMutation({
    onSuccess: () => {
      utils.activeWindowEvents.getEventsForDateRange.invalidate()
    },
    onError: (error) => {
      console.error('Failed to delete manual entry:', error)
      alert('Error: Could not delete the entry. Please try again.')
    }
  })

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    startTime: { hour: number; minute: number } | null
    endTime: { hour: number; minute: number } | null
    editingEntry: TimeBlock | null
  }>({
    isOpen: false,
    startTime: null,
    endTime: null,
    editingEntry: null
  })

  // Scroll to current hour when viewing today
  useEffect(() => {
    if (isToday && currentHourRef.current && scrollContainerRef.current) {
      currentHourRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isToday, timeBlocks, scrollContainerRef])

  // Adjust scroll position on zoom to keep the view centered
  useLayoutEffect(() => {
    const scrollElement = scrollContainerRef.current
    if (!scrollElement) return

    const prevHourHeight = prevHourHeightRef.current
    const zoomRatio = hourHeight / prevHourHeight

    if (zoomRatio !== 1) {
      const { scrollTop, clientHeight } = scrollElement
      const scrollCenter = scrollTop + clientHeight / 2
      const newScrollTop = scrollCenter * zoomRatio - clientHeight / 2
      scrollElement.scrollTop = newScrollTop
    }

    // Update ref for the next render
    prevHourHeightRef.current = hourHeight
  }, [hourHeight, scrollContainerRef])

  const yToTime = (y: number) => {
    if (!timelineContainerRef.current) return null

    const containerRect = timelineContainerRef.current.getBoundingClientRect()
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

    console.log('minute', minute)

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

  const handleSelectionEnd = (
    startTime: { hour: number; minute: number },
    endTime: { hour: number; minute: number }
  ) => {
    setModalState({ isOpen: true, startTime, endTime, editingEntry: null })
  }

  const {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    resetDragState
  } = useTimeSelection(yToTime, handleSelectionEnd, !modalState.isOpen)

  const handleModalClose = () => {
    setModalState({ isOpen: false, startTime: null, endTime: null, editingEntry: null })
    resetDragState()
  }

  const handleModalSubmit = (data: { name: string; categoryId?: string }) => {
    if (modalState.editingEntry) {
      if (!token || !modalState.editingEntry._id) return
      updateManualEntry.mutate({
        token,
        id: modalState.editingEntry._id,
        name: data.name,
        categoryId: data.categoryId
      })
    } else if (modalState.startTime && modalState.endTime && token) {
      const getAbsTime = (time: { hour: number; minute: number }) => {
        const date = new Date(currentTime)
        date.setHours(time.hour, time.minute, 0, 0)
        return date.getTime()
      }

      createManualEntry.mutate({
        token,
        name: data.name,
        categoryId: data.categoryId,
        startTime: getAbsTime(modalState.startTime),
        endTime: getAbsTime(modalState.endTime)
      })
    }
    handleModalClose()
  }

  const handleModalDelete = (entryId: string) => {
    if (!token) return
    if (window.confirm('Are you sure you want to delete this entry?')) {
      deleteManualEntry.mutate({ token, id: entryId })
      handleModalClose()
    }
  }

  const handleSelectManualEntry = (entry: TimeBlock) => {
    setModalState({
      isOpen: true,
      startTime: null,
      endTime: null,
      editingEntry: entry
    })
  }

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    const minutePercentage = (minutes / 60) * 100
    return { hours, minutePercentage }
  }

  return (
    <div className="flex-1">
      <TooltipProvider>
        <div
          ref={timelineContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="relative"
        >
          <SelectionBox
            isVisible={dragState.isDragging || modalState.isOpen}
            dragState={dragState}
            yToTime={yToTime}
          />

          {Array.from({ length: 24 }).map((_, hour) => {
            let currentActiveSegment: EnrichedTimelineSegment | null = null
            const { hours: currentHour, minutePercentage } = getCurrentTimePosition()
            const showCurrentTime = isToday && hour === currentHour
            const isCurrentHour = hour === currentHour
            const isSelectedHour = selectedHour === hour
            const individualSegmentOpacity = selectedHour !== null && !isSelectedHour ? 0.5 : 1
            const isLastHour = hour === 23

            const timelineSegments = getTimelineSegmentsForHour(hour, timeBlocks)

            // current activity helpers
            if (showCurrentTime && timelineSegments.length > 0) {
              const lastSegment = timelineSegments[timelineSegments.length - 1]
              const currentMinute = currentTime.getMinutes()
              if (lastSegment.endMinute > currentMinute) {
                lastSegment.heightPercentage =
                  ((currentMinute - lastSegment.startMinute) / 60) * 100
                lastSegment.endMinute = currentMinute
                currentActiveSegment = lastSegment
              }
            }

            return (
              <div key={hour} className="relative">
                <TimelineHour
                  hour={hour}
                  timelineSegments={timelineSegments}
                  isCurrentHour={isCurrentHour}
                  isSelectedHour={isSelectedHour}
                  isDarkMode={isDarkMode}
                  individualSegmentOpacity={individualSegmentOpacity}
                  currentHourRef={currentHourRef}
                  onHourSelect={onHourSelect}
                  onSelectManualEntry={handleSelectManualEntry}
                  isLastHour={isLastHour}
                  currentActiveSegment={currentActiveSegment}
                  hourHeight={hourHeight}
                  selectedHour={selectedHour}
                />
                {showCurrentTime && (
                  <CurrentTimeIndicator
                    minutePercentage={minutePercentage}
                    currentTime={currentTime}
                  />
                )}
              </div>
            )
          })}
        </div>
      </TooltipProvider>
      {modalState.isOpen && (
        <CreateEntryModal
          isOpen={modalState.isOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          onDelete={handleModalDelete}
          startTime={modalState.startTime}
          endTime={modalState.endTime}
          existingEntry={modalState.editingEntry}
        />
      )}
    </div>
  )
}

export default DayTimeline
