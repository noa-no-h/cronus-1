import { formatDuration } from '@renderer/lib/activityByCategoryWidgetHelpers'
import React from 'react'
import type { ProcessedCategory } from '../lib/activityProcessing'

interface CategorySectionHeaderProps {
  category: ProcessedCategory
  variant?: 'default' | 'empty'
}

export const CategorySectionHeader: React.FC<CategorySectionHeaderProps> = ({
  category,
  variant = 'default'
}) => {
  if (variant === 'empty') {
    return (
      <div className="sticky top-0 z-10 flex pl-2 justify-between items-center mb-1 border-b border-border bg-card py-2">
        <div className="flex items-center">
          <span
            className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
            style={{ backgroundColor: category.color }}
          ></span>
          <h3 className="text-md font-semibold text-foreground">{category.name.toUpperCase()}</h3>
        </div>
        <span className="text-md font-semibold text-foreground">
          {formatDuration(category.totalDurationMs)}
        </span>
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-10 flex ml-2 justify-between items-center mb-1 border-b border-border bg-card py-2">
      <div className="flex items-center">
        <span
          className="w-4 h-4 rounded-full mr-2 flex-shrink-0"
          style={{ backgroundColor: category.color }}
        ></span>
        <h3 className="text-md font-semibold text-primary">{category.name}</h3>
      </div>
      <span className="text-md font-semibold text-foreground">
        {formatDuration(category.totalDurationMs)}
      </span>
    </div>
  )
}
