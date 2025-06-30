import React from 'react'
import { TimelineHour } from './TimelineHour'

interface TimelineGridProps {
  currentHour: number
  selectedHour: number | null
  currentHourRef: React.RefObject<HTMLDivElement | null>
  hourHeight: number
  onHourSelect: (hour: number | null) => void
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({
  currentHour,
  selectedHour,
  currentHourRef,
  hourHeight,
  onHourSelect
}) => {
  return (
    <>
      {/* Background Grid */}
      {Array.from({ length: 24 }).map((_, hour) => (
        <TimelineHour
          key={hour}
          hour={hour}
          isCurrentHour={hour === currentHour}
          isSelectedHour={selectedHour === hour}
          currentHourRef={hour === currentHour ? currentHourRef : null}
          isLastHour={hour === 23}
          hourHeight={hourHeight}
          onHourSelect={onHourSelect}
        />
      ))}
    </>
  )
}
