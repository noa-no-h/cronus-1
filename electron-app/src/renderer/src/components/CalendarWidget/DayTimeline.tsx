import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useManualEntry } from '../../hooks/useManualEntry'
import { useTimeSelection } from '../../hooks/useTimeSelection'
import { hexToRgba } from '../../lib/colors'
import {
  convertYToTime,
  getTimelineSegmentsForDay,
  type DaySegment,
  type TimeBlock
} from '../../lib/dayTimelineHelpers'
import { CreateEntryModal } from './CreateEntryModal'
import { CurrentTimeIndicator } from './CurrentTimeIndicator'
import { SelectionBox } from './SelectionBox'
import { TimelineHour } from './TimelineHour'
import TimelineSegmentContent from './TimelineSegmentContent'
import { TimelineSegmentTooltip } from './TimelineSegmentTooltip'

export type { TimeBlock }

interface DayTimelineProps {
  timeBlocks: TimeBlock[]
  currentTime: Date
  dayForEntries: Date
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
  dayForEntries,
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
  const justModifiedRef = useRef(false)
  const { token } = useAuth()
  const [resizingState, setResizingState] = useState<{
    isResizing: boolean
    entry: DaySegment | null
    direction: 'top' | 'bottom' | null
    startY: number | null
  }>({
    isResizing: false,
    entry: null,
    direction: null,
    startY: null
  })

  const [movingState, setMovingState] = useState<{
    isMoving: boolean
    entry: DaySegment | null
    startY: number | null
    initialTop: number | null
  }>({
    isMoving: false,
    entry: null,
    startY: null,
    initialTop: null
  })

  const [previewState, setPreviewState] = useState<{
    top: number
    height: number
    backgroundColor: string
  } | null>(null)

  const {
    modalState,
    handleModalClose,
    handleModalSubmit,
    handleModalDelete,
    handleSelectManualEntry,
    openNewEntryModal,
    updateManualEntry
  } = useManualEntry({ baseDate: dayForEntries, onModalClose: () => resetDragState() })

  const {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    resetDragState
  } = useTimeSelection(
    timelineContainerRef as React.RefObject<HTMLDivElement>,
    (y: number) => {
      if (!timelineContainerRef.current) return null
      // y is already relative to the timeline container, so we pass it directly
      return convertYToTime(y, timelineContainerRef.current, hourHeight)
    },
    (startTime, endTime) => {
      openNewEntryModal(startTime, endTime)
    },
    !modalState.isOpen && !resizingState.isResizing && !movingState.isMoving
  )

  const timelineHeight = useMemo(() => {
    const rootFontSize = 16 // Assuming default 16px
    return 24 * hourHeight * rootFontSize
  }, [hourHeight])

  const daySegments = useMemo(
    () => getTimelineSegmentsForDay(timeBlocks, timelineHeight),
    [timeBlocks, timelineHeight]
  )

  const SEGMENT_TOP_OFFSET_PX = 1
  const SEGMENT_SPACING_PX = 1 // Gap between segments
  const totalSegmentVerticalSpacing = SEGMENT_TOP_OFFSET_PX + SEGMENT_SPACING_PX

  const handleResizeStart = (
    entry: DaySegment,
    direction: 'top' | 'bottom',
    e: React.MouseEvent
  ) => {
    if (modalState.isOpen || dragState.isDragging || movingState.isMoving) return
    resetDragState() // Prevent new entry drag
    e.stopPropagation()

    setResizingState({
      isResizing: true,
      entry,
      direction,
      startY: e.clientY
    })
  }

  const handleMoveStart = (entry: DaySegment, e: React.MouseEvent) => {
    if (modalState.isOpen || resizingState.isResizing || dragState.isDragging) return
    resetDragState() // Prevent new entry drag
    e.stopPropagation()

    setMovingState({
      isMoving: true,
      entry,
      startY: e.clientY,
      initialTop: entry.top
    })
  }

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (resizingState.isResizing && resizingState.entry && resizingState.startY) {
      const { entry, startY, direction } = resizingState
      const deltaY = e.clientY - startY

      // Snap to nearest 5 minutes
      const minutesPerPixel = (24 * 60) / timelineHeight
      const deltaMinutes = Math.round((deltaY * minutesPerPixel) / 5) * 5
      const pixelsPerMinute = timelineHeight / (24 * 60)
      const snappedDeltaY = deltaMinutes * pixelsPerMinute

      let newTop: number
      let newHeight: number

      if (direction === 'top') {
        newTop = entry.top + snappedDeltaY
        newHeight = entry.height - snappedDeltaY
      } else {
        // 'bottom'
        newTop = entry.top
        newHeight = entry.height + snappedDeltaY
      }

      // Clamp resize
      newHeight = Math.max(5, newHeight) // Min height 5px
      if (direction === 'top') {
        newTop = Math.min(newTop, entry.top + entry.height - 5)
      }

      setPreviewState({
        top: newTop,
        height: newHeight,
        backgroundColor: segmentBackgroundColor(entry)
      })
    } else if (
      movingState.isMoving &&
      movingState.entry &&
      movingState.startY &&
      movingState.initialTop !== null
    ) {
      const { entry, startY, initialTop } = movingState
      const deltaY = e.clientY - startY

      const minutesPerPixel = (24 * 60) / timelineHeight
      const deltaMinutes = Math.round((deltaY * minutesPerPixel) / 5) * 5
      const pixelsPerMinute = timelineHeight / (24 * 60)
      const snappedDeltaY = deltaMinutes * pixelsPerMinute
      const newTop = initialTop + snappedDeltaY

      setPreviewState({
        top: newTop,
        height: entry.height,
        backgroundColor: segmentBackgroundColor(entry)
      })
    } else {
      handleMouseMove(e)
    }
  }

  // Scroll to current hour when viewing today
  useEffect(() => {
    if (isToday && currentHourRef.current && scrollContainerRef.current) {
      currentHourRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isToday, scrollContainerRef])

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

  const handleTimelineMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    let actionTaken = false
    if (resizingState.isResizing && resizingState.entry && resizingState.startY) {
      const { entry, direction, startY } = resizingState
      actionTaken = true

      const deltaY = e.clientY - startY
      const minutesPerPixel = (24 * 60) / timelineHeight
      // Snap to nearest 5 minutes
      const deltaMinutes = Math.round((deltaY * minutesPerPixel) / 5) * 5

      let newStartTime = new Date(entry.startTime)
      let newEndTime = new Date(entry.endTime)

      if (direction === 'top') {
        newStartTime.setMinutes(newStartTime.getMinutes() + deltaMinutes)
      } else {
        // 'bottom'
        newEndTime.setMinutes(newEndTime.getMinutes() + deltaMinutes)
      }

      // Basic validation
      if (newEndTime <= newStartTime) {
        if (direction === 'top') {
          newStartTime = new Date(newEndTime.getTime() - 60000) // 1 min duration
        } else {
          newEndTime = new Date(newStartTime.getTime() + 60000) // 1 min duration
        }
      }

      const durationMs = newEndTime.getTime() - newStartTime.getTime()

      if (entry._id && durationMs > 0 && token) {
        updateManualEntry.mutate({
          token,
          id: entry._id,
          startTime: newStartTime.getTime(),
          durationMs
        })
      }
    } else if (movingState.isMoving && movingState.entry && movingState.startY) {
      const { entry, startY } = movingState
      actionTaken = true

      const deltaY = e.clientY - startY
      const minutesPerPixel = (24 * 60) / timelineHeight
      const deltaMinutes = Math.round((deltaY * minutesPerPixel) / 5) * 5

      const newStartTime = new Date(entry.startTime)
      newStartTime.setMinutes(newStartTime.getMinutes() + deltaMinutes)

      const durationMs = new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()

      if (entry._id && token) {
        updateManualEntry.mutate({
          token,
          id: entry._id,
          startTime: newStartTime.getTime(),
          durationMs
        })
      }
    }

    if (actionTaken) {
      justModifiedRef.current = true
    }

    // Reset state regardless of what happened
    setResizingState({ isResizing: false, entry: null, direction: null, startY: null })
    setMovingState({ isMoving: false, entry: null, startY: null, initialTop: null })
    setPreviewState(null)
    handleMouseUp(e)
  }

  const yToTime = (y: number) => {
    if (!timelineContainerRef.current) return null
    return convertYToTime(y, timelineContainerRef.current, hourHeight)
  }

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours()
    return { hours }
  }

  const { hours: currentHour } = getCurrentTimePosition()
  const showCurrentTime = isToday
  const segmentBackgroundColor = (segment: DaySegment) =>
    segment.categoryColor
      ? hexToRgba(segment.categoryColor, isDarkMode ? 0.5 : 0.3)
      : hexToRgba('#808080', isDarkMode ? 0.3 : 0.2)

  return (
    <div className="flex-1">
      <div
        ref={timelineContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleTimelineMouseMove}
        onMouseUp={handleTimelineMouseUp}
        onMouseLeave={handleMouseLeave}
        className="relative"
        style={{ height: timelineHeight }}
      >
        {/* Background Grid */}
        {Array.from({ length: 24 }).map((_, hour) => (
          <TimelineHour
            key={hour}
            hour={hour}
            isCurrentHour={hour === currentHour}
            isSelectedHour={selectedHour === hour}
            currentHourRef={hour === currentHour ? currentHourRef : null}
            isLastHour={hour === 23}
            hourHeight={hourHeight}
          />
        ))}

        {/* Event Segments */}
        <div className="absolute inset-0">
          {daySegments.map((segment) => {
            const isManual = segment.type === 'manual'
            const canInteract = isManual || (selectedHour === null && !isManual)
            const segmentCursor = isManual ? 'pointer' : 'default'
            const isCalendarEvent = segment.name === 'Google Calendar'

            const positionClasses = isCalendarEvent
              ? 'absolute left-1/2 right-1 rounded-md' // Calendar events: right half only
              : `absolute left-[67px] right-1 rounded-md` // Regular activities: full width

            // calendar events appear in front of regular events so they're not hidden
            const zIndexClass = isCalendarEvent ? 'z-20' : 'z-10'

            return (
              <TimelineSegmentTooltip
                key={segment._id || `${segment.name}-${segment.startTime}`}
                segment={segment}
              >
                <div
                  data-is-segment="true"
                  className={`group ${positionClasses} ${zIndexClass}
                          ${canInteract ? 'hover:brightness-75' : ''} transition-all
                          overflow-hidden`}
                  style={{
                    cursor: segmentCursor,
                    backgroundColor: segmentBackgroundColor(segment),
                    top: `${segment.top + SEGMENT_TOP_OFFSET_PX}px`,
                    height: `max(1px, ${segment.height - totalSegmentVerticalSpacing}px)`,
                    opacity:
                      selectedHour !== null && Math.floor(segment.startMinute / 60) !== selectedHour
                        ? 0.5
                        : 1
                  }}
                  onMouseDown={(e) => {
                    if (isManual) {
                      handleMoveStart(segment, e)
                    }
                  }}
                  onClick={() => {
                    // If a resize or move just happened, prevent the modal from opening
                    // and reset the ref for the next click.
                    if (justModifiedRef.current) {
                      justModifiedRef.current = false
                      return
                    }
                    if (isManual) {
                      handleSelectManualEntry(segment)
                    }
                  }}
                >
                  {isManual && (
                    <>
                      <div
                        className="absolute top-0 left-0 right-0 h-4 -translate-y-1/2 cursor-row-resize z-30 group"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          handleResizeStart(segment, 'top', e)
                        }}
                      >
                        <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="w-3 h-1.5 flex flex-col justify-between">
                            <div className="w-full h-[1px] bg-gray-400 dark:bg-gray-500 rounded-full" />
                            <div className="w-full h-[1px] bg-gray-400 dark:bg-gray-500 rounded-full" />
                          </div>
                        </div>
                      </div>
                      <div
                        className="absolute bottom-0 left-0 right-0 h-4 translate-y-1/2 cursor-row-resize z-30 group"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          handleResizeStart(segment, 'bottom', e)
                        }}
                      >
                        <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="w-3 h-1.5 flex flex-col justify-between">
                            <div className="w-full h-[1px] bg-gray-400 dark:bg-gray-500 rounded-full" />
                            <div className="w-full h-[1px] bg-gray-400 dark:bg-gray-500 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <TimelineSegmentContent segment={segment} isDarkMode={isDarkMode} />
                </div>
              </TimelineSegmentTooltip>
            )
          })}
        </div>

        {previewState && (
          <div
            className={`absolute left-[67px] right-1 rounded-md z-20 pointer-events-none`}
            style={{
              top: `${previewState.top}px`,
              height: `${previewState.height}px`,
              backgroundColor: previewState.backgroundColor
            }}
          />
        )}
        <SelectionBox
          isVisible={dragState.isDragging || modalState.isOpen}
          dragState={dragState}
          yToTime={yToTime}
        />

        {showCurrentTime && (
          <CurrentTimeIndicator currentTime={currentTime} timelineHeight={timelineHeight} />
        )}
      </div>
      {modalState.isOpen && (
        <CreateEntryModal
          isOpen={modalState.isOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          onDelete={handleModalDelete}
          startTime={modalState.startTime}
          endTime={modalState.endTime}
          existingEntry={modalState.editingEntry as TimeBlock | null}
        />
      )}
    </div>
  )
}

export default DayTimeline
