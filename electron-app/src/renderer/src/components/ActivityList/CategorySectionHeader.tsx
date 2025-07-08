import { formatDuration } from '@renderer/lib/timeFormatting'
import { XIcon } from 'lucide-react'
import React from 'react'
import { Category as SharedCategory } from 'shared'
import type { ProcessedCategory } from '../../lib/activityProcessing'
import { Button } from '../ui/button'
import { MoveSelectedActivitiesButton } from './MoveSelectedActivitiesButton'

interface CategorySectionHeaderProps {
  category: ProcessedCategory
  variant?: 'default' | 'empty'
  isAnyActivitySelected?: boolean
  otherCategories?: SharedCategory[]
  isMovingActivity?: boolean
  handleMoveSelected?: (targetCategoryId: string) => void
  handleClearSelection?: () => void
  onAddNewCategory?: () => void
}

export const CategorySectionHeader: React.FC<CategorySectionHeaderProps> = ({
  category,
  variant = 'default',
  isAnyActivitySelected,
  otherCategories,
  isMovingActivity,
  handleMoveSelected,
  handleClearSelection,
  onAddNewCategory
}) => {
  const showMoveButton =
    isAnyActivitySelected &&
    otherCategories &&
    otherCategories.length > 0 &&
    handleMoveSelected &&
    isMovingActivity !== undefined &&
    onAddNewCategory

  const renderButtons = () => {
    if (!showMoveButton) return null
    return (
      <div className="flex items-center gap-2">
        <MoveSelectedActivitiesButton
          otherCategories={otherCategories}
          handleMove={handleMoveSelected}
          isMoving={isMovingActivity}
          onAddNewCategory={onAddNewCategory}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleClearSelection}
          aria-label="Clear selection"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (variant === 'empty') {
    return (
      <div className="sticky top-0 z-10 flex select-none items-center justify-between border-b border-border bg-card py-2 pl-2">
        <div className="flex items-center">
          <span
            className="mr-2 h-3 w-3 flex-shrink-0 rounded-full"
            style={{ backgroundColor: category.color }}
          ></span>
          <h3 className="text-md font-semibold text-foreground">{category.name.toUpperCase()}</h3>
        </div>
        {showMoveButton ? (
          renderButtons()
        ) : (
          <span className="text-md font-semibold text-foreground">
            {formatDuration(category.totalDurationMs)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-10 flex select-none items-center justify-between border-b border-border bg-card py-2">
      <div className="flex items-center ml-1">
        <span
          className="mr-2 h-4 w-4 flex-shrink-0 rounded-full"
          style={{ backgroundColor: category.color }}
        ></span>
        <h3 className="text-md font-semibold text-primary">{category.name}</h3>
      </div>
      {showMoveButton ? (
        renderButtons()
      ) : (
        <span className="text-md font-semibold text-foreground">
          {formatDuration(category.totalDurationMs)}
        </span>
      )}
    </div>
  )
}
