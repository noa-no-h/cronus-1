import { useState } from 'react'

export type DragState = {
  isSelecting: boolean
  isDragging: boolean
  startPos: { y: number } | null
  currentPos: { y: number } | null
}

export const useTimeSelection = (
  yToTime: (y: number) => { hour: number; minute: number; y: number } | null,
  onSelectionEnd: (
    startTime: { hour: number; minute: number },
    endTime: { hour: number; minute: number }
  ) => void,
  isEnabled: boolean
) => {
  const [dragState, setDragState] = useState<DragState>({
    isSelecting: false,
    isDragging: false,
    startPos: null,
    currentPos: null
  })

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEnabled) return
    // Prevent starting a drag on an existing element, only on the timeline grid
    const target = e.target as HTMLElement
    if (target.closest('.group')) {
      const startPos = yToTime(e.clientY)
      if (!startPos) return

      setDragState({
        isSelecting: true,
        isDragging: false,
        startPos: { y: e.clientY },
        currentPos: { y: e.clientY }
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.isSelecting) return

    setDragState((prev) => {
      if (!prev.startPos) return prev
      const isDragging = prev.isDragging || Math.abs(e.clientY - prev.startPos.y) > 5 // 5px threshold
      return { ...prev, isDragging, currentPos: { y: e.clientY } }
    })
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.isSelecting || !dragState.isDragging) {
      setDragState({ isSelecting: false, isDragging: false, startPos: null, currentPos: null })
      return
    }

    const startTime = yToTime(dragState.startPos!.y)
    const endTime = yToTime(e.clientY)

    if (startTime && endTime) {
      const selectionStart = startTime.y < endTime.y ? startTime : endTime
      const selectionEnd = startTime.y < endTime.y ? endTime : startTime

      if (
        selectionEnd.hour * 60 + selectionEnd.minute >
        selectionStart.hour * 60 + selectionStart.minute
      ) {
        onSelectionEnd(
          { hour: selectionStart.hour, minute: selectionStart.minute },
          { hour: selectionEnd.hour, minute: selectionEnd.minute }
        )
      }
    }
    // Keep selection box visible by only resetting isSelecting and isDragging
    setDragState((prev) => ({ ...prev, isSelecting: false, isDragging: false }))
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.isSelecting && dragState.isDragging) {
      handleMouseUp(e)
    } else if (dragState.isSelecting) {
      // If we are not dragging, just cancel it
      resetDragState()
    }
  }

  const resetDragState = () => {
    setDragState({
      isSelecting: false,
      isDragging: false,
      startPos: null,
      currentPos: null
    })
  }

  return {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    resetDragState
  }
}
