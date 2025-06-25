import React from 'react'

import { formatDuration } from '../../lib/activityByCategoryWidgetHelpers'
import { EnrichedTimelineSegment } from '../../lib/dayTimelineHelpers'
import { ActivityIcon } from '../ActivityList/ActivityIcon'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

interface TimelineSegmentTooltipProps {
  segment: EnrichedTimelineSegment
  children: React.ReactNode
}

export const TimelineSegmentTooltip = ({ segment, children }: TimelineSegmentTooltipProps) => {
  if (segment.type === 'manual' || Object.keys(segment.allActivities).length === 0) {
    return <>{children}</>
  }

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
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
                  <div key={key} className="flex items-center justify-between text-xs">
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
}
