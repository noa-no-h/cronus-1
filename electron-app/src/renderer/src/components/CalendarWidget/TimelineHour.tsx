import clsx from 'clsx'
import { MoreHorizontal, X } from 'lucide-react'
import { memo } from 'react'

import { formatDuration } from '../../lib/activityByCategoryWidgetHelpers'
import { hexToRgba } from '../../lib/colors'
import { EnrichedTimelineSegment, TimeBlock } from '../../lib/dayTimelineHelpers'
import { ActivityIcon } from '../ActivityList/ActivityIcon'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import TimelineSegmentContent from './TimelineSegmentContent'

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
        <div className="w-14 py-2 text-xs text-muted-foreground font-medium flex-col sticky left-0 flex items-center justify-between pr-2">
          <span className="select-none">{hour.toString().padStart(2, '0')}:00</span>
          {/* only show this below if the hours has entries */}
          {timelineSegments.length > 0 && (
            <TooltipProvider>
              <Tooltip delayDuration={150}>
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
                    {isSelectedHour ? <X size={14} /> : <MoreHorizontal size={14} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" align="start" sideOffset={10}>
                  <div className="text-xs select-none">
                    {isSelectedHour ? 'Unselect this hour' : 'View activities in this hour'}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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

                return (
                  <Tooltip key={`${hour}-${segment.name}-${idx}`} delayDuration={200}>
                    <TooltipTrigger asChild>
                      <div
                        className={`absolute left-1 right-1 rounded-md
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
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start" sideOffset={10}>
                      <div className="p-2 space-y-1 w-64 text-left">
                        <p className="font-bold mb-2">Activities in this slot:</p>
                        {(() => {
                          const allActivitiesSorted = Object.entries(segment.allActivities).sort(
                            ([, a], [, b]) => b.duration - a.duration
                          )

                          const visibleActivities = allActivitiesSorted.filter(
                            ([, data]) => data.duration >= 30000
                          )
                          const hiddenCount = allActivitiesSorted.length - visibleActivities.length

                          return (
                            <>
                              {visibleActivities.map(([key, data]) => (
                                <div
                                  key={key}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center space-x-2 truncate">
                                    <ActivityIcon url={data.block.url} appName={key} size={12} />
                                    <span className="truncate">{key}</span>
                                  </div>
                                  <span className="flex-shrink-0 text-muted-foreground pl-2">
                                    {formatDuration(data.duration)}
                                  </span>
                                </div>
                              ))}
                              {hiddenCount > 0 && (
                                <p className="text-xs text-muted-foreground italic pt-1">
                                  ... and {hiddenCount} more activit
                                  {hiddenCount > 1 ? 'ies' : 'y'} under 30s.
                                </p>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }
)
