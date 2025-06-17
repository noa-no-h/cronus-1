import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { HourlyTimelineSegment } from './TimelineTooltipContent'
import { ActivityIcon } from './ActivityIcon'

const TimelineSegmentContent = ({ segment }: { segment: HourlyTimelineSegment }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canShowIcon, setCanShowIcon] = useState(false)
  const [canShowText, setCanShowText] = useState(false)
  const [textWidth, setTextWidth] = useState(0)

  // A callback ref to measure the text's width once it's rendered.
  const textMeasurementRef = useCallback((node: HTMLSpanElement | null) => {
    if (node !== null) {
      setTextWidth(node.scrollWidth)
    }
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    // We need the container and the text's width to proceed.
    if (!container || textWidth === 0) return

    const checkSize = () => {
      if (!container) return

      const containerWidth = container.clientWidth
      const iconWidth = 12 // from className 'w-3'
      const horizontalPadding = 8 // from className 'px-1' (4px left + 4px right)
      const spaceBetweenElements = 4 // from className 'space-x-1'

      const requiredWidthForIcon = iconWidth + horizontalPadding
      const requiredWidthForFullContent =
        iconWidth + spaceBetweenElements + textWidth + horizontalPadding

      setCanShowIcon(containerWidth >= requiredWidthForIcon)
      setCanShowText(containerWidth >= requiredWidthForFullContent)
    }

    // Observe the container for size changes.
    const resizeObserver = new ResizeObserver(checkSize)
    resizeObserver.observe(container)
    checkSize() // Perform an initial size check.

    // Clean up the observer on unmount.
    return () => resizeObserver.disconnect()
  }, [textWidth]) // Rerun this effect when the text width is known.

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
    >
      {/*
        This span is used for measurement only.
        It's rendered invisibly and positioned absolutely so it doesn't affect layout.
      */}
      <span
        ref={textMeasurementRef}
        className="text-xs font-medium absolute opacity-0 -z-10 pointer-events-none"
      >
        {segment.name}
      </span>

      {/* Conditionally render the content based on available space. */}
      {canShowIcon && (
        <div className="flex items-center space-x-1 px-1">
          <ActivityIcon url={segment.url} appName={segment.name} size={12} />
        </div>
      )}
    </div>
  )
}

export default TimelineSegmentContent
