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
  let timeColorCls = 'text-gray-400'
  let borderColorCls = 'border-transparent'
  let labelColorCls = 'text-gray-400'
  let bgColorCls = 'bg-gray-700/30'

  if (isHighlighted && highlightColor) {
    labelColorCls = 'text-white'
    bgColorCls = 'bg-gray-700/50'
    switch (highlightColor) {
      case 'green':
        timeColorCls = 'text-green-400'
        borderColorCls = 'border-green-400'
        break
      case 'red':
        timeColorCls = 'text-red-400'
        borderColorCls = 'border-red-400'
        break
      case 'orange':
        timeColorCls = 'text-orange-400'
        borderColorCls = 'border-orange-400'
        break
    }
  }

  return (
    <div
      className={clsx(
        'rounded-md border flex items-center justify-center h-full transition-all duration-300 ease-in-out',
        bgColorCls,
        borderColorCls,
        isEnlarged ? 'flex-auto gap-2 px-1.5 py-1.5' : 'flex-col gap-1 w-[32%] px-1 py-.5'
      )}
    >
      <span className={clsx('text-xs font-normal pointer-events-none', labelColorCls)}>
        {label}
      </span>
      <span
        className={clsx(
          'font-mono pointer-events-none',
          timeColorCls,
          isEnlarged ? 'text-2xl font-semibold' : 'text-sm'
        )}
      >
        {time}
      </span>
    </div>
  )
}

export default StatusBox
