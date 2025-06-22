// Placeholder

interface CurrentTimeIndicatorProps {
  minutePercentage: number
  currentTime: Date
}

export const CurrentTimeIndicator = ({
  minutePercentage,
  currentTime
}: CurrentTimeIndicatorProps) => {
  return (
    <>
      <div
        className="absolute right-0 h-0.5 bg-red-500 z-10 left-14"
        style={{ top: `${minutePercentage}%` }}
      >
        <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-red-500 z-20" />
      </div>
    </>
  )
}
