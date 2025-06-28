import React from 'react'
import { DragState } from '../../hooks/useTimeSelection'

interface SelectionBoxProps {
  isVisible: boolean
  dragState: DragState
  yToTime: (y: number) => { y: number } | null
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({ isVisible, dragState, yToTime }) => {
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
      className="absolute left-[67px] right-1 bg-blue-500/30 border-2 border-blue-500 rounded-md z-10 pointer-events-none"
      style={{
        top: `${top + 1}px`,
        height: `${Math.max(0, height - 2)}px`
      }}
    />
  )
}
