import { RefObject, useState } from 'react'

export type DragState = {
  isSelecting: boolean
  isDragging: boolean
  startPos: { y: number } | null
  currentPos: { y: number } | null
}

export const useTimeSelection = (
  timelineContainerRef: RefObject<HTMLDivElement>,
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

  const getRelativeY = (clientY: number) => {
    if (!timelineContainerRef.current) return 0
    const rect = timelineContainerRef.current.getBoundingClientRect()
    return clientY - rect.top
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEnabled || !timelineContainerRef.current) return

    // Do not start a drag if clicking on an existing segment or its children
    const target = e.target as HTMLElement
    if (target.closest('[data-is-segment="true"]')) {
      return
    }

    const startY = getRelativeY(e.clientY)
    const startPos = yToTime(startY)
    if (!startPos) return

    setDragState({
      isSelecting: true,
      isDragging: false,
      startPos: { y: startY },
      currentPos: { y: startY }
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.isSelecting || !timelineContainerRef.current) return

    setDragState((prev) => {
      if (!prev.startPos) return prev
      const currentY = getRelativeY(e.clientY)
      const isDragging = prev.isDragging || Math.abs(currentY - prev.startPos.y) > 5 // 5px threshold
      return { ...prev, isDragging, currentPos: { y: currentY } }
    })
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.isSelecting || !dragState.isDragging || !timelineContainerRef.current) {
      setDragState({ isSelecting: false, isDragging: false, startPos: null, currentPos: null })
      return
    }

    const endY = getRelativeY(e.clientY)
    const startTime = yToTime(dragState.startPos!.y)
    const endTime = yToTime(endY)

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
