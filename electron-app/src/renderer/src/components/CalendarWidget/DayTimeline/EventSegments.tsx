import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@renderer/components/ui/context-menu'
import clsx from 'clsx'
import { endOfDay, startOfDay } from 'date-fns'
import { AnimatePresence } from 'framer-motion'
import React from 'react'
import { getDarkerColor, getLighterColor, hexToRgba } from '../../../lib/colors'
import { type DaySegment } from '../../../lib/dayTimelineHelpers'
import { trpc } from '../../../utils/trpc'
import { CalendarEventTooltip } from './CalendarEventTooltip'
import { MultiCalendarEventTooltip } from './MultiCalendarEventTooltip'
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
  token: string | null
  dayForEntries: Date
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
  totalSegmentVerticalSpacing,
  type,
  layout,
  token,
  dayForEntries
}) => {
  const utils = trpc.useUtils()
  const deleteEventsMutation = trpc.activeWindowEvents.deleteEventsInDateRange.useMutation({
    onMutate: async (deletedRange) => {
      const queryInput = {
        token: token || '',
        startDateMs: startOfDay(dayForEntries).getTime(),
        endDateMs: endOfDay(dayForEntries).getTime()
      }
      await utils.activeWindowEvents.getEventsForDateRange.cancel(queryInput)
      const previousEvents = utils.activeWindowEvents.getEventsForDateRange.getData(queryInput)

      utils.activeWindowEvents.getEventsForDateRange.setData(queryInput, (oldData) => {
        if (!oldData) return []
        return oldData.filter((event) => {
          const eventStartTime = event.timestamp
          const eventEndTime = event.timestamp + (event.durationMs || 0)
          const overlaps =
            eventStartTime < deletedRange.endDateMs && eventEndTime > deletedRange.startDateMs
          return !overlaps
        })
      })

      return { previousEvents }
    },
    onError: (err, newEntry, context) => {
      const queryInput = {
        token: token || '',
        startDateMs: startOfDay(dayForEntries).getTime(),
        endDateMs: endOfDay(dayForEntries).getTime()
      }
      if (context?.previousEvents) {
        utils.activeWindowEvents.getEventsForDateRange.setData(queryInput, context.previousEvents)
      }
      console.error('Failed to delete segment:', err)
      alert('Error: Could not delete the segment. Please try again.')
    },
    onSettled: () => {
      const queryInput = {
        token: token || '',
        startDateMs: startOfDay(dayForEntries).getTime(),
        endDateMs: endOfDay(dayForEntries).getTime()
      }
      utils.activeWindowEvents.getEventsForDateRange.invalidate(queryInput)
    }
  })

  const handleDeleteSegment = (segment: DaySegment) => {
    if (!token) return

    const dayStart = startOfDay(dayForEntries)
    const startTime = new Date(dayStart.getTime() + segment.startMinute * 60000)
    const endTime = new Date(dayStart.getTime() + segment.endMinute * 60000)

    console.log(
      'deleting segment from',
      startTime.toISOString(),
      'to',
      endTime.toISOString(),
      'full segment',
      JSON.stringify(segment, null, 2)
    )
    deleteEventsMutation.mutate({
      token: token,
      startDateMs: startTime.getTime(),
      endDateMs: endTime.getTime()
    })
  }

  return (
    <AnimatePresence mode="sync">
      {daySegments.map((segment, index) => {
        const isManual = segment.type === 'manual'
        const isCalendarEvent = type === 'calendar'
        const isSuggestion = segment.isSuggestion
        const isGroupedCalendarEvent =
          isCalendarEvent && !!segment.groupedEvents && segment.groupedEvents.length > 0

        const textColor = segment.categoryColor
          ? isDarkMode
            ? getLighterColor(segment.categoryColor, 0.8)
            : getDarkerColor(segment.categoryColor, 0.6)
          : undefined

        const suggestionBorderColor = textColor || (isDarkMode ? '#4b5563' : '#d1d5db') // gray-600 or gray-300

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

        const canInteract = isManual && !isSuggestion
        const segmentCursor = canInteract ? 'pointer' : 'default'
        const zIndexClass = isCalendarEvent ? 'z-20' : 'z-10'

        const segmentDiv = (
          <div
            data-is-segment="true"
            className={clsx(
              'group transition-all overflow-hidden',
              positionClasses,
              zIndexClass,
              canInteract && 'hover:brightness-75',
              isSuggestion && 'border-[1px] border-dotted border-gray-400 dark:border-gray-500'
            )}
            style={{
              cursor: segmentCursor,
              backgroundColor: isSuggestion
                ? segment.categoryColor
                  ? hexToRgba(segment.categoryColor, 0.1)
                  : 'transparent'
                : segmentBackgroundColor(segment),
              borderColor: isSuggestion ? suggestionBorderColor : undefined,
              top: `${segment.top + SEGMENT_TOP_OFFSET_PX}px`,
              height: `max(1px, ${segment.height - totalSegmentVerticalSpacing}px)`,
              opacity:
                selectedHour !== null && Math.floor(segment.startMinute / 60) !== selectedHour
                  ? 0.5
                  : 1
            }}
            onMouseDown={(e) => {
              if (canInteract) {
                onMoveStart(segment, e)
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (canInteract) {
                onSegmentClick(segment)
              }
            }}
          >
            <TimelineSegmentContent segment={segment} isDarkMode={isDarkMode} />
            {canInteract && (
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

        const content = (
          <ContextMenu>
            <ContextMenuTrigger>{segmentDiv}</ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleDeleteSegment(segment)}>
                Delete Segment
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )

        if (isGroupedCalendarEvent) {
          return (
            <MultiCalendarEventTooltip
              key={segment._id || `${segment.startTime}-${segment.name}`}
              events={segment.groupedEvents!}
            >
              {content}
            </MultiCalendarEventTooltip>
          )
        }

        if (isCalendarEvent) {
          return (
            <CalendarEventTooltip
              key={segment._id || `${segment.startTime}-${segment.name}`}
              event={segment.originalEvent}
            >
              {content}
            </CalendarEventTooltip>
          )
        }

        return (
          <TimelineSegmentTooltip
            key={segment._id || `${segment.startTime}-${segment.name}`}
            segment={segment}
          >
            {content}
          </TimelineSegmentTooltip>
        )
      })}
    </AnimatePresence>
  )
}
