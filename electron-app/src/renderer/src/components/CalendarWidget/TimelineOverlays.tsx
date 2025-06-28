import React from 'react'
import { type DragState } from '../../hooks/useTimeSelection'
import { CurrentTimeIndicator } from './CurrentTimeIndicator'
import { SelectionBox } from './SelectionBox'

interface TimelineOverlaysProps {
  previewState: { top: number; height: number; backgroundColor: string } | null
  dragState: DragState
  yToTime: (y: number) => { y: number } | null
  isToday: boolean
  currentTime: Date
  timelineHeight: number
  isDragging: boolean
  isModalOpen: boolean
}

export const TimelineOverlays: React.FC<TimelineOverlaysProps> = ({
  previewState,
  dragState,
  yToTime,
  isToday,
  currentTime,
  timelineHeight,
  isDragging,
  isModalOpen
}) => {
  return (
    <>
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
      <SelectionBox isVisible={isDragging || isModalOpen} dragState={dragState} yToTime={yToTime} />

      {isToday && (
        <CurrentTimeIndicator currentTime={currentTime} timelineHeight={timelineHeight} />
      )}
    </>
  )
}
