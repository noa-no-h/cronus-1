import React, { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDuration } from '../../lib/activityByCategoryWidgetHelpers'
import { EnrichedTimelineSegment } from '../../lib/dayTimelineHelpers'
import { ActivityIcon } from '../ActivityList/ActivityIcon'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { CalendarEventTooltip } from './CalendarEventTooltip'

interface TimelineSegmentTooltipProps {
  segment: EnrichedTimelineSegment
  children: React.ReactNode
}

export const TimelineSegmentTooltip = ({ segment, children }: TimelineSegmentTooltipProps) => {
  const [showAllActivities, setShowAllActivities] = useState(false)

  // Check if this is a Google Calendar event
  const isCalendarEvent = segment.name === 'Google Calendar'

  // For calendar events, use the CalendarEventTooltip
  if (isCalendarEvent && (segment as any).originalEvent) {
    return (
      <CalendarEventTooltip event={(segment as any).originalEvent}>{children}</CalendarEventTooltip>
    )
  }

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

            const mainActivities = allActivitiesSorted.filter(([, data]) => data.duration >= 30000)
            const shortActivities = allActivitiesSorted.filter(([, data]) => data.duration < 30000)

            return (
              <>
                {/* Always show main activities */}
                {mainActivities.map(([key, data]) => (
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

                {/* Expandable short activities section */}
                {shortActivities.length > 0 && (
                  <div className="pt-1">
                    <button
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                    >
                      {showAllActivities ? (
                        <ChevronDownIcon className="w-3 h-3" />
                      ) : (
                        <ChevronRightIcon className="w-3 h-3" />
                      )}
                      <span className="italic">
                        {shortActivities.length} short activit
                        {shortActivities.length > 1 ? 'ies' : 'y'} (&lt;30s)
                      </span>
                    </button>

                    <AnimatePresence>
                      {showAllActivities && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-4 mt-1 space-y-1 border-l border-border pl-2"
                        >
                          {shortActivities.map(([key, data]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between text-xs opacity-80"
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <ActivityIcon url={data.block.url} appName={key} size={10} />
                                <span className="truncate">{key}</span>
                              </div>
                              <span className="flex-shrink-0 text-muted-foreground pl-2">
                                {formatDuration(data.duration)}
                              </span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
