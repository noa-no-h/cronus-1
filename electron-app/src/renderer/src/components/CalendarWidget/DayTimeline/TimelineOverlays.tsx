import clsx from 'clsx'
import React from 'react'
import { CurrentTimeIndicator } from './CurrentTimeIndicator'
import { SelectionBox } from './SelectionBox'

interface TimelineOverlaysProps {
  previewState: {
    top: number
    height: number
    backgroundColor: string
  } | null
  dragState: any
  yToTime: (y: number) => { hour: number; minute: number; y: number } | null
  isToday: boolean
  currentTime: Date
  timelineHeight: number
  isDragging: boolean
  isModalOpen: boolean
  hasGoogleCalendarEvents: boolean
}

export const TimelineOverlays: React.FC<TimelineOverlaysProps> = ({
  previewState,
  dragState,
  yToTime,
  isToday,
  currentTime,
  timelineHeight,
  isDragging,
  isModalOpen,
  hasGoogleCalendarEvents
}) => {
  return (
    <>
      {previewState && (
        <div
          className={clsx(
            `absolute left-[67px] rounded-md z-20 pointer-events-none`,
            previewState.hasOverlappingCalendarEvents ? 'right-1/3 mr-2' : 'right-1'
          )}
          style={{
            top: `${previewState.top}px`,
            height: `${previewState.height}px`,
            backgroundColor: previewState.backgroundColor
          }}
        />
      )}
      <SelectionBox
        isVisible={isDragging || isModalOpen}
        dragState={dragState}
        yToTime={yToTime}
        hasGoogleCalendarEvents={hasGoogleCalendarEvents}
      />

      {isToday && (
        <CurrentTimeIndicator currentTime={currentTime} timelineHeight={timelineHeight} />
      )}
    </>
  )
}
