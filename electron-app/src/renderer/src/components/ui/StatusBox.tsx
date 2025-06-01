import clsx from 'clsx'
import React from 'react'

interface StatusBoxProps {
  label: string
  time: string // Placeholder for now, e.g., "00:00:00"
  isHighlighted: boolean // Determines if this box should use its highlight color and be prominent
  highlightColor?: 'green' | 'red' | 'orange'
  isEnlarged: boolean // Determines if this box takes more space
}

const StatusBox: React.FC<StatusBoxProps> = ({
  label,
  time,
  isHighlighted,
  highlightColor,
  isEnlarged
}) => {
  // Default styles for non-highlighted state
  let timeColorCls = 'text-foreground'
  let borderColorCls = 'border-border'
  let labelColorCls = 'text-muted-foreground'
  let bgColorCls = 'bg-card'

  if (isHighlighted) {
    // Highlighted state overrides
    labelColorCls = 'text-primary' // Label is always primary when highlighted
    bgColorCls = 'bg-accent'

    if (highlightColor) {
      borderColorCls = `border-${highlightColor}-500`
      switch (highlightColor) {
        case 'green':
          timeColorCls = 'text-green-500'
          break
        case 'red':
          timeColorCls = 'text-red-500'
          break
        case 'orange':
          timeColorCls = 'text-orange-500'
          break
      }
    } else {
      // Fallback if highlighted but no specific R/G/O color
      timeColorCls = 'text-primary'
      borderColorCls = 'border-primary'
    }
  }

  return (
    <div
      className={clsx(
        'rounded-md border flex items-center justify-center h-full transition-all duration-300 ease-in-out',
        bgColorCls,
        borderColorCls,
        isEnlarged ? 'flex-auto gap-2 px-1.5 py-1.5' : 'flex-col gap-1 w-[32%] px-1 py-0.5'
      )}
    >
      <span
        className={clsx(
          'font-sm font-medium pointer-events-none',
          labelColorCls,
          isEnlarged ? 'text-sm ' : 'text-xs'
        )}
      >
        {label}
      </span>
      <span
        className={clsx(
          'font-mono pointer-events-none',
          timeColorCls,
          isEnlarged ? 'text-2xl font-semibold' : 'text-sm text-primary'
        )}
      >
        {time}
      </span>
    </div>
  )
}

export default StatusBox
