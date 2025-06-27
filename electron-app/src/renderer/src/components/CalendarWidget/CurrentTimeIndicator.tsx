import { memo } from 'react'

interface CurrentTimeIndicatorProps {
  currentTime: Date
  timelineHeight: number
}

export const CurrentTimeIndicator = memo(
  ({ currentTime, timelineHeight }: CurrentTimeIndicatorProps) => {
    const totalMinutesInDay = 24 * 60
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
    const topPosition = (currentMinutes / totalMinutesInDay) * timelineHeight

    return (
      <div
        className="absolute w-full z-10 pointer-events-none"
        style={{
          top: `${topPosition}px`
        }}
      >
        <div className="relative h-px bg-red-500">
          <div className="absolute -top-1 left-0 h-2 w-2 rounded-full bg-red-500"></div>
          <div className="absolute -top-1 -right-px h-2 w-2 rounded-full bg-red-500"></div>
        </div>
      </div>
    )
  }
)
