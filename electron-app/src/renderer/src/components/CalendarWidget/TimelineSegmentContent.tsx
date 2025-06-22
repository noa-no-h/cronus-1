import { useLayoutEffect, useRef, useState } from 'react'
import { getDarkerColor } from '../../lib/colors'
import { EnrichedTimelineSegment } from '../../lib/dayTimelineHelpers'
import { ActivityIcon } from '../ActivityList/ActivityIcon'

const TimelineSegmentContent = ({ segment }: { segment: EnrichedTimelineSegment }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canShowContent, setCanShowContent] = useState(false)
  const [canShowIcon, setCanShowIcon] = useState(false)

  useLayoutEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        setCanShowIcon(containerRef.current.offsetHeight > 10)
        setCanShowContent(containerRef.current.offsetHeight > 20)
      }
    }
    checkSize()

    const resizeObserver = new ResizeObserver(checkSize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  const textColor = segment.categoryColor ? getDarkerColor(segment.categoryColor, 0.6) : undefined

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-start justify-center overflow-hidden px-2"
      style={{ color: textColor }}
    >
      {canShowIcon && (
        <div className="flex flex-row items-center space-x-2 py-0.5">
          <ActivityIcon url={segment.url} appName={segment.name} size={12} />
          {canShowContent && (
            <span className="text-xs font-medium text-left leading-tight">{segment.name}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default TimelineSegmentContent
