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
      className="absolute left-[68px] mr-1 my-1 right-0 bg-blue-500/30 border-2 border-blue-500 rounded-md z-10 pointer-events-none transition-all duration-0 ease-out"
      style={{
        top: `${top}px`,
        height: `${height}px`
      }}
    />
  )
}
