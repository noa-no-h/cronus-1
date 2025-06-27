import clsx from 'clsx'
import { useLayoutEffect, useRef, useState } from 'react'
import { getDarkerColor, getLighterColor } from '../../lib/colors'
import { EnrichedTimelineSegment } from '../../lib/dayTimelineHelpers'
import { ActivityIcon } from '../ActivityList/ActivityIcon'

const TimelineSegmentContent = ({
  segment,
  isDarkMode
}: {
  segment: EnrichedTimelineSegment
  isDarkMode: boolean
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canShowContent, setCanShowContent] = useState(false)
  const [isLarge, setIsLarge] = useState(false)

  useLayoutEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight
        // Show content when height is sufficient for a line of text.
        setCanShowContent(height > 18)
        // Consider it "large" if it's taller than 50px.
        setIsLarge(height > 30)
      }
    }
    checkSize()

    const resizeObserver = new ResizeObserver(checkSize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  const textColor = segment.categoryColor
    ? isDarkMode
      ? getLighterColor(segment.categoryColor, 0.8)
      : getDarkerColor(segment.categoryColor, 0.6)
    : undefined

  return (
    <div
      ref={containerRef}
      className={clsx(
        'w-full h-full flex flex-row justify-start space-x-2 overflow-hidden px-2 flex-grow',
        isLarge ? 'items-start pt-2' : 'items-center'
      )}
      style={{ color: textColor }}
    >
      {canShowContent && (
        <>
          {segment.type === 'manual' ? (
            <div
              className="h-3 w-3 flex-shrink-0 rounded-full"
              style={{ backgroundColor: segment.categoryColor }}
            />
          ) : (
            <ActivityIcon
              url={segment.url}
              appName={segment.name}
              size={12}
              className="flex-shrink-0"
            />
          )}
          <span className="truncate text-xs font-medium text-left leading-tight min-w-0">
            {segment.description || segment.name}
          </span>
        </>
      )}
    </div>
  )
}

export default TimelineSegmentContent
