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

  const textColor = segment.categoryColor
    ? isDarkMode
      ? getLighterColor(segment.categoryColor, 0.8)
      : getDarkerColor(segment.categoryColor, 0.6)
    : undefined

  return (
    <div
      ref={containerRef}
      className={clsx(
        'w-full h-full flex flex-col items-start justify-start overflow-hidden px-2',
        canShowContent ? 'pt-2' : 'pt-0.5'
      )}
      style={{ color: textColor }}
    >
      {canShowIcon && (
        <div className="flex w-full flex-row items-center space-x-2 py-0.5">
          {segment.type === 'manual' ? (
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: segment.categoryColor }}
            />
          ) : (
            <ActivityIcon url={segment.url} appName={segment.name} size={12} />
          )}
          {canShowContent && (
            <span className="truncate text-xs font-medium text-left leading-tight min-w-0">
              {segment.description || segment.name}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default TimelineSegmentContent
