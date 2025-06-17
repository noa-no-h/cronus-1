import { formatDuration } from '@renderer/lib/activityByCategoryWidgetHelpers'
import { ActivityItem, ProcessedCategory } from '@renderer/lib/activityProcessing'
import clsx from 'clsx'
import React from 'react'
import { Category as SharedCategory } from 'shared'
import { ActivityIcon } from './ActivityIcon'
import { MoveActivityButton } from './MoveActivityButton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface ActivityListItemProps {
  activity: ActivityItem
  isSelected: boolean
  isPrevSelected: boolean
  isNextSelected: boolean
  currentCategory: ProcessedCategory
  allUserCategories: SharedCategory[] | undefined
  handleMoveActivity: (activity: ActivityItem, targetCategoryId: string) => void
  isMovingActivity: boolean
  faviconErrors: Set<string>
  handleFaviconError: (identifier: string) => void
  hoveredActivityKey: string | null
  setHoveredActivityKey: (key: string | null) => void
  openDropdownActivityKey: string | null
  setOpenDropdownActivityKey: (key: string | null) => void
  onSelectActivity: (activityKey: string, event: React.MouseEvent) => void
  selectedHour: number | null
  selectedDay: Date | null
  viewMode: 'day' | 'week'
  startDateMs: number | null
  endDateMs: number | null
}

export const ActivityListItem = ({
  activity,
  isSelected,
  isPrevSelected,
  isNextSelected,
  currentCategory,
  allUserCategories,
  handleMoveActivity,
  isMovingActivity,
  faviconErrors,
  handleFaviconError,
  hoveredActivityKey,
  setHoveredActivityKey,
  openDropdownActivityKey,
  setOpenDropdownActivityKey,
  onSelectActivity,
  selectedHour,
  selectedDay,
  viewMode,
  startDateMs,
  endDateMs
}: ActivityListItemProps) => {
  const activityKey = `${activity.identifier}-${activity.name}`
  const otherCategories =
    currentCategory.id === 'uncategorized'
      ? allUserCategories || []
      : allUserCategories?.filter((cat) => cat._id !== currentCategory.id) || []
  const showMoveUI =
    (hoveredActivityKey === activityKey || openDropdownActivityKey === activityKey) &&
    otherCategories.length > 0 &&
    !isSelected

  let borderRadiusClass = 'rounded-md'
  if (isSelected) {
    if (isPrevSelected && isNextSelected) {
      borderRadiusClass = ''
    } else if (isPrevSelected) {
      borderRadiusClass = 'rounded-b-md'
    } else if (isNextSelected) {
      borderRadiusClass = 'rounded-t-md'
    }
  }

  return (
    <div
      key={activityKey}
      className={`group flex w-full select-none items-center cursor-pointer justify-between px-2 py-0.5 ${borderRadiusClass} ${
        isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-muted'
      }`}
      onMouseEnter={() => setHoveredActivityKey(activityKey)}
      onMouseLeave={() => setHoveredActivityKey(null)}
    >
      <div
        className="flex flex-1 items-center min-w-0"
        onClick={(e) => onSelectActivity(activityKey, e)}
      >
        <ActivityIcon
          itemType={
            activity.itemType === 'website'
              ? 'website'
              : activity.itemType === 'app'
                ? 'app'
                : 'other'
          }
          url={activity.originalUrl}
          appName={activity.identifier}
          size={16}
          className="mr-2"
          color={currentCategory.color}
          onFaviconError={() => handleFaviconError(activity.identifier)}
          showFallback={faviconErrors.has(activity.identifier)}
          fallbackText={activity.identifier.charAt(0).toUpperCase()}
        />
        <span
          className={clsx(
            'text-sm text-muted-foreground block truncate',
            isSelected ? 'text-primary' : ''
          )}
          title={activity.name}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{activity.name}</span>
              </TooltipTrigger>
              <TooltipContent className="overflow-x-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                {activity.name}
                <br />
                <ul>
                  <li>
                    <strong>Name:</strong> {activity.name}
                  </li>
                  <li>
                    <strong>Identifier:</strong> {activity.identifier}
                  </li>
                  {activity.originalUrl && (
                    <li className="whitespace-normal break-all">
                      <strong>URL:</strong> {activity.originalUrl}
                    </li>
                  )}
                  <li>
                    <strong>Type:</strong> {activity.itemType}
                  </li>
                  <li>
                    <strong>Duration:</strong> {formatDuration(activity.durationMs)}
                  </li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </span>
      </div>
      <div className="flex items-center flex-shrink-0 ml-2">
        {showMoveUI ? (
          <MoveActivityButton
            activity={activity}
            otherCategories={otherCategories}
            handleMoveActivity={handleMoveActivity}
            isMovingActivity={isMovingActivity}
            selectedHour={selectedHour}
            selectedDay={selectedDay}
            viewMode={viewMode}
            startDateMs={startDateMs}
            endDateMs={endDateMs}
            openDropdownActivityKey={openDropdownActivityKey}
            setOpenDropdownActivityKey={setOpenDropdownActivityKey}
            activityKey={activityKey}
            setHoveredActivityKey={setHoveredActivityKey}
          />
        ) : (
          <span className="text-sm text-muted-foreground">
            {formatDuration(activity.durationMs)}
          </span>
        )}
      </div>
    </div>
  )
}
