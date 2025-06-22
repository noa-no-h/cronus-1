import clsx from 'clsx'
import { memo } from 'react'

import { formatDuration } from '../../lib/activityByCategoryWidgetHelpers'
import { hexToRgba } from '../../lib/colors'
import { EnrichedTimelineSegment } from '../../lib/dayTimelineHelpers'
import { ActivityIcon } from '../ActivityList/ActivityIcon'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
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
  isLastHour: boolean
  currentActiveSegment: EnrichedTimelineSegment | null
  hourHeight: number
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
    isLastHour,
    currentActiveSegment,
    hourHeight
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
          'group relative pl-2 flex cursor-pointer border-slate-300 dark:border-slate-600',
          isSelectedHour ? 'bg-blue-200/20 dark:bg-blue-800/30' : 'hover:bg-muted/50',
          isLastHour ? '' : 'border-b'
        )}
        ref={isCurrentHour ? currentHourRef : null}
        onClick={() => onHourSelect(isSelectedHour ? null : hour)}
      >
        <div className="w-12 py-2 text-xs text-muted-foreground font-medium sticky left-0 flex items-start">
          <span>{hour.toString().padStart(2, '0')}:00</span>
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
                return (
                  <Tooltip key={`${hour}-${segment.name}-${idx}`} delayDuration={200}>
                    <TooltipTrigger asChild>
                      <div
                        className={`absolute left-1 right-1 rounded-md
                          hover:brightness-75 transition-all cursor-pointer
                          flex items-center justify-center overflow-hidden`}
                        style={{
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
                      >
                        <TimelineSegmentContent segment={segment} />
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
