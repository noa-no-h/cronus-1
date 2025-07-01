import clsx from 'clsx'
import React from 'react'
import { DragState } from '../../hooks/useTimeSelection'

interface SelectionBoxProps {
  isVisible: boolean
  dragState: DragState
  yToTime: (y: number) => { y: number } | null
  hasGoogleCalendarEvents: boolean
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  isVisible,
  dragState,
  yToTime,
  hasGoogleCalendarEvents
}) => {
  if (!isVisible || !dragState.startPos || !dragState.currentPos) {
    return null
  }

  const start = yToTime(dragState.startPos.y)
  const end = yToTime(dragState.currentPos.y)
  if (!start || !end) return null

  const top = Math.min(start.y, end.y)
  const height = Math.abs(start.y - end.y)

  return (
    <div
      className={clsx(
        'absolute bg-blue-500/30 border-2 border-blue-500 rounded-md z-10 pointer-events-none left-[67px]',
        hasGoogleCalendarEvents ? 'right-1/3 mr-2' : 'right-1'
      )}
      style={{
        top: `${top + 1}px`,
        height: `${Math.max(0, height - 2)}px`
      }}
    />
  )
}
