import React from 'react'
import { type DaySegment } from '../../lib/dayTimelineHelpers'
import { CalendarEventTooltip } from './CalendarEventTooltip'
import TimelineSegmentContent from './TimelineSegmentContent'
import { TimelineSegmentTooltip } from './TimelineSegmentTooltip'

interface EventSegmentsProps {
  daySegments: DaySegment[]
  selectedHour: number | null
  isDarkMode: boolean
  segmentBackgroundColor: (segment: DaySegment) => string
  onSegmentClick: (entry: DaySegment) => void
  onResizeStart: (entry: DaySegment, direction: 'top' | 'bottom', e: React.MouseEvent) => void
  onMoveStart: (entry: DaySegment, e: React.MouseEvent) => void
  SEGMENT_TOP_OFFSET_PX: number
  totalSegmentVerticalSpacing: number
  type: 'activity' | 'calendar'
  layout: 'full' | 'split'
}

export const EventSegments = ({
  daySegments,
  selectedHour,
  isDarkMode,
  segmentBackgroundColor,
  onSegmentClick,
  onResizeStart,
  onMoveStart,
  SEGMENT_TOP_OFFSET_PX,
  totalSegmentVerticalSpacing,
  type,
  layout
}: EventSegmentsProps) => {
  return (
    <>
      {daySegments.map((segment) => {
        const isManual = segment.type === 'manual'
        const isCalendarEvent = type === 'calendar'

        const positionClasses =
          layout === 'full'
            ? `absolute left-[67px] right-1 rounded-md` // Full width
            : isCalendarEvent
              ? 'absolute left-2/3 right-1 rounded-md' // Split, right half
              : `absolute left-[67px] right-1/3 mr-2 rounded-md` // Split, left half

        // If an hour is selected, only show segments that are part of that hour
        const segmentHeight = segment.height - totalSegmentVerticalSpacing
        if (segmentHeight <= 0) {
          return null // Don't render segments that are too small to be visible
        }

        const canInteract = isManual
        const segmentCursor = isManual ? 'pointer' : 'default'
        const zIndexClass = isCalendarEvent ? 'z-20' : 'z-10'

        const content = (
          <div
            key={segment._id || `${segment.startTime}-${segment.name}`}
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
                onMoveStart(segment, e)
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (isManual) {
                onSegmentClick(segment)
              }
            }}
          >
            <TimelineSegmentContent segment={segment} isDarkMode={isDarkMode} />
            {isManual && (
              <>
                <div
                  className="absolute top-0 left-0 right-0 h-4 -translate-y-1/2 cursor-row-resize z-30 group"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    onResizeStart(segment, 'top', e)
                  }}
                >
                  <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="w-4 h-3 flex flex-col justify-between">
                      <div className="w-full h-[2px] bg-gray-400 dark:bg-gray-500 rounded-full" />
                      <div className="w-full h-[2px] bg-gray-400 dark:bg-gray-500 rounded-full" />
                    </div>
                  </div>
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-4 translate-y-1/2 cursor-row-resize z-30 group"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    onResizeStart(segment, 'bottom', e)
                  }}
                >
                  <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="w-4 h-3 flex flex-col justify-between">
                      <div className="w-full h-[2px] bg-gray-400 dark:bg-gray-500 rounded-full" />
                      <div className="w-full h-[2px] bg-gray-400 dark:bg-gray-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )

        if (isCalendarEvent) {
          return (
            <CalendarEventTooltip event={segment.originalEvent}>{content}</CalendarEventTooltip>
          )
        }

        return <TimelineSegmentTooltip segment={segment}>{content}</TimelineSegmentTooltip>
      })}
    </>
  )
}
