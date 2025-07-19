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

const getDefaultEmojiForCategory = (categoryName: string): string => {
  switch (categoryName.toLowerCase()) {
    case 'work':
      return '💼'
    case 'distraction':
      return '🎮'
    case 'uncategorized':
      return '❓'
    default:
      return '📁'
  }
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

  // Get emoji for the category
  const categoryEmoji = category.emoji || getDefaultEmojiForCategory(category.name)

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
          <span className="mr-2 text-lg">{categoryEmoji}</span>
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
        <div
          className="px-3 py-1 rounded-md text-sm font-medium transition-all overflow-hidden flex items-center gap-2 text-black dark:text-white"
          style={{
            backgroundColor: `${category.color}50`
          }}
        >
          <span className="text-base">{categoryEmoji}</span>
          <span>{category.name}</span>
        </div>
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
