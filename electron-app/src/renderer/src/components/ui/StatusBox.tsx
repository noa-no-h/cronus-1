import clsx from 'clsx'
import { EditIcon } from 'lucide-react'
import React, { useState } from 'react'
import { Category } from 'shared'

interface StatusBoxProps {
  label: string
  time: string // Placeholder for now, e.g., "00:00:00"
  isHighlighted: boolean // Determines if this box should use its highlight color and be prominent
  highlightColor?: 'green' | 'red' | 'orange'
  isEnlarged: boolean // Determines if this box takes more space
  categoryDetails?: Category
  onCategoryClick?: () => void
}

const StatusBox: React.FC<StatusBoxProps> = ({
  label,
  time,
  isHighlighted,
  highlightColor,
  isEnlarged,
  categoryDetails,
  onCategoryClick
}) => {
  const [isHovered, setIsHovered] = useState(false)

  // Default styles for non-highlighted state
  let timeColorCls = 'text-foreground'
  let borderColorCls = 'border-border'
  let labelColorCls = 'text-muted-foreground'

  if (isHighlighted) {
    // Highlighted state overrides
    labelColorCls = 'text-primary' // Label is always primary when highlighted

    if (highlightColor) {
      borderColorCls = `border-${highlightColor}-500`
      switch (highlightColor) {
        case 'green':
          timeColorCls = 'text-green-300'
          break
        case 'red':
          timeColorCls = 'text-red-300'
          break
        case 'orange':
          timeColorCls = 'text-orange-300'
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        'rounded-md border flex items-center bg-secondary justify-center h-full transition-all duration-300 ease-in-out relative',
        borderColorCls,
        isEnlarged ? 'flex-auto gap-2 px-1.5 py-1.5' : 'flex-col gap-[5px] w-[32%] px-1 py-0.5'
      )}
    >
      <span
        onClick={() => isEnlarged && onCategoryClick && onCategoryClick()}
        className={clsx(
          'font-sm font-medium flex flex-row items-center gap-1',
          labelColorCls,
          isEnlarged && 'pr-2 category-name-area hover:underline cursor-pointer',
          isHovered && isEnlarged && 'bg-white/10 rounded-md p-1'
        )}
        style={{ fontSize: isEnlarged ? '0.875rem' : '10px' }}
      >
        {isHovered && isEnlarged && (
          <EditIcon className="w-4 h-4  text-muted-foreground mr-2 cursor-pointer" />
        )}
        {categoryDetails?.name || label}
        {process.env.NODE_ENV === 'development' && ' Dev'}
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
