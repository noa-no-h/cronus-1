import React from 'react'
import { type DaySegment } from '../../lib/dayTimelineHelpers'
import TimelineSegmentContent from './TimelineSegmentContent'
import { TimelineSegmentTooltip } from './TimelineSegmentTooltip'

interface EventSegmentsProps {
  daySegments: DaySegment[]
  selectedHour: number | null
  isDarkMode: boolean
  segmentBackgroundColor: (segment: DaySegment) => string
  onSegmentClick: (segment: DaySegment) => void
  onResizeStart: (entry: DaySegment, direction: 'top' | 'bottom', e: React.MouseEvent) => void
  onMoveStart: (entry: DaySegment, e: React.MouseEvent) => void
  SEGMENT_TOP_OFFSET_PX: number
  totalSegmentVerticalSpacing: number
}

export const EventSegments: React.FC<EventSegmentsProps> = ({
  daySegments,
  selectedHour,
  isDarkMode,
  segmentBackgroundColor,
  onSegmentClick,
  onResizeStart,
  onMoveStart,
  SEGMENT_TOP_OFFSET_PX,
  totalSegmentVerticalSpacing
}) => {
  return (
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
                  onMoveStart(segment, e)
                }
              }}
              onClick={() => onSegmentClick(segment)}
            >
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
                      onResizeStart(segment, 'bottom', e)
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
  )
}
