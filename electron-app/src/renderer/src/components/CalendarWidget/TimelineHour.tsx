import clsx from 'clsx'
import { FilterIcon, X } from 'lucide-react'
import { memo } from 'react'

import { hexToRgba } from '../../lib/colors'
import { EnrichedTimelineSegment, TimeBlock } from '../../lib/dayTimelineHelpers'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import TimelineSegmentContent from './TimelineSegmentContent'
import { TimelineSegmentTooltip } from './TimelineSegmentTooltip'

interface TimelineHourProps {
  hour: number
  timelineSegments: EnrichedTimelineSegment[]
  isCurrentHour: boolean
  isSelectedHour: boolean
  isDarkMode: boolean
  individualSegmentOpacity: number
  currentHourRef: React.RefObject<HTMLDivElement | null>
  onHourSelect: (hour: number | null) => void
  onSelectManualEntry: (entry: TimeBlock) => void
  isLastHour: boolean
  currentActiveSegment: EnrichedTimelineSegment | null
  hourHeight: number
  selectedHour: number | null
}

export const TimelineHour = memo(
  ({
    hour,
    timelineSegments,
    isCurrentHour,
    isSelectedHour,
    isDarkMode,
    individualSegmentOpacity,
    currentHourRef,
    onHourSelect,
    onSelectManualEntry,
    isLastHour,
    currentActiveSegment,
    hourHeight,
    selectedHour
  }: TimelineHourProps) => {
    const SEGMENT_TOP_OFFSET_PX = 1
    const SEGMENT_SPACING_PX = 1 // Gap between segments
    const MIN_SEGMENT_HEIGHT_PX = 1

    // Total reduction in height for a standard segment to create top and bottom spacing.
    const totalSegmentVerticalSpacing = SEGMENT_TOP_OFFSET_PX + SEGMENT_SPACING_PX

    return (
      <div
        key={hour}
        className={clsx(
          'group relative pl-2 flex border-slate-300 dark:border-slate-600',
          isSelectedHour
            ? 'bg-blue-200/20 dark:bg-blue-800/30'
            : selectedHour === null // only apply hover when no hour is selected
              ? 'todo'
              : '',
          isLastHour ? '' : 'border-b'
        )}
        ref={isCurrentHour ? currentHourRef : null}
      >
        <div className="w-14 py-2 text-xs text-muted-foreground font-medium flex-col sticky left-0 flex items-center justify-between pr-2 z-10">
          <span className={clsx(isSelectedHour && 'text-blue-500')}>
            {hour.toString().padStart(2, '0')}:00
          </span>
          {/* only show this below if the hours has entries */}
          {timelineSegments.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 place-self-center opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    onHourSelect(isSelectedHour ? null : hour)
                  }}
                >
                  {isSelectedHour ? <X size={10} /> : <FilterIcon size={10} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="z-50" side="right" align="start" sideOffset={10}>
                <div className="text-xs select-none">
                  {isSelectedHour ? 'Unselect this hour' : 'View activities in this hour'}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
          <div></div>
        </div>

        <div className="flex-1 border-l relative">
          <div
            className={`relative rounded-md pt-1.5 ${
              isSelectedHour && 'bg-blue-200/20 dark:bg-blue-800/30'
            }`}
            style={{ height: `${hourHeight}rem` }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-md">
              <div className="absolute inset-0 flex flex-col">
                {Array.from({ length: 4 }).map((_, quarter) => (
                  <div
                    key={quarter}
                    className="flex-1 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                  />
                ))}
              </div>

              {timelineSegments.map((segment, idx) => {
                const isCurrentActive = segment === currentActiveSegment
                const isManual = segment.type === 'manual'
                const canInteract = isManual || (selectedHour === null && !isManual)
                const segmentCursor = isManual ? 'pointer' : 'default'

                // Check if this is a calendar event
                // TODO: also check if "calendar"? Not sure why but that was the previous code that was causing a TS error.
                const isCalendarEvent = segment.name === 'Google Calendar'

                const positionClasses = isCalendarEvent
                  ? 'absolute left-1/2 right-1 rounded-md' // Calendar events: right half only
                  : 'absolute left-1 right-1 rounded-md' // Regular activities: full width

                return (
                  <TimelineSegmentTooltip key={`${hour}-${segment.name}-${idx}`} segment={segment}>
                    <div
                      className={`${positionClasses}
                          ${canInteract ? 'hover:brightness-75' : ''} transition-all
                          flex items-center justify-center overflow-hidden`}
                      style={{
                        cursor: segmentCursor,
                        backgroundColor: segment.categoryColor
                          ? hexToRgba(segment.categoryColor, isDarkMode ? 0.5 : 0.3)
                          : hexToRgba('#808080', isDarkMode ? 0.3 : 0.2),
                        top: `calc(${segment.topPercentage}% + ${SEGMENT_TOP_OFFSET_PX}px)`,
                        height: `max(${MIN_SEGMENT_HEIGHT_PX}px, calc(${
                          segment.heightPercentage
                        }% - ${
                          isCurrentActive
                            ? `${SEGMENT_TOP_OFFSET_PX}px`
                            : `${totalSegmentVerticalSpacing}px`
                        }))`,
                        opacity: individualSegmentOpacity
                      }}
                      onClick={() => {
                        if (isManual) {
                          onSelectManualEntry(segment)
                        }
                      }}
                    >
                      <TimelineSegmentContent segment={segment} isDarkMode={isDarkMode} />
                    </div>
                  </TimelineSegmentTooltip>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }
)
