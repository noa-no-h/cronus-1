import clsx from 'clsx'
import React from 'react'
import { Category as SharedCategory } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../hooks/use-toast'
import {
  ActivityItem,
  extractActivityDetailsFromEvent,
  ProcessedCategory
} from '../../lib/activityProcessing'
import { formatDuration } from '../../lib/timeFormatting'
import { trpc } from '../../utils/trpc'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '../ui/context-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { ActivityIcon } from './ActivityIcon'
import { MoveActivityButton } from './MoveActivityButton'

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
  onAddNewCategory: () => void
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
  endDateMs,
  onAddNewCategory
}: ActivityListItemProps) => {
  const selectionKey = `${activity.identifier}-${activity.name}`
  const uniqueKey = `${currentCategory.id}-${activity.identifier}-${activity.name}`

  const otherCategories =
    currentCategory.id === 'uncategorized'
      ? allUserCategories || []
      : allUserCategories?.filter((cat) => cat._id !== currentCategory.id) || []
  const showMoveUI =
    (hoveredActivityKey === uniqueKey || openDropdownActivityKey === uniqueKey) &&
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

  const { token } = useAuth()
  const utils = trpc.useUtils()

  const deleteActivityMutation = trpc.activeWindowEvents.deleteActivitiesByIdentifier.useMutation({
    onMutate: async (deletedActivity) => {
      // Optimistically update to the new value
      if (!startDateMs || !endDateMs || !token) {
        return
      }

      const queryInput = {
        token,
        startDateMs,
        endDateMs
      }

      await utils.activeWindowEvents.getEventsForDateRange.cancel(queryInput)
      const previousEvents = utils.activeWindowEvents.getEventsForDateRange.getData(queryInput)

      utils.activeWindowEvents.getEventsForDateRange.setData(queryInput, (oldData) => {
        if (!oldData) return []
        return oldData.filter((event) => {
          const eventWithDate = {
            ...event,
            lastCategorizationAt: event.lastCategorizationAt
              ? new Date(event.lastCategorizationAt)
              : undefined
          }
          const { identifier: eventIdentifier } = extractActivityDetailsFromEvent(eventWithDate)
          return eventIdentifier !== deletedActivity.identifier
        })
      })

      return { previousEvents }
    },
    onSuccess(data, variables) {
      if (data.deletedCount && data.deletedCount > 0) {
        toast({
          duration: 1000,
          title: 'Successfully deleted activity',
          description: `Deleted ${data.deletedCount} events for "${variables.identifier}"`
        })
      }
    },
    onError: (err, newPost, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (!startDateMs || !endDateMs || !token) {
        return
      }
      const queryInput = {
        token,
        startDateMs,
        endDateMs
      }
      if (context?.previousEvents) {
        utils.activeWindowEvents.getEventsForDateRange.setData(queryInput, context.previousEvents)
      }
    },
    onSettled: () => {
      // After either success or error, refetch the data to ensure consistency
      if (!startDateMs || !endDateMs || !token) {
        return
      }
      const queryInput = {
        token,
        startDateMs,
        endDateMs
      }
      utils.activeWindowEvents.getEventsForDateRange.invalidate(queryInput)
    }
  })

  const handleDeleteActivity = (activity: ActivityItem): void => {
    if (!token || !startDateMs || !endDateMs) return

    deleteActivityMutation.mutate({
      token,
      startDateMs,
      endDateMs,
      identifier: activity.identifier,
      itemType: activity.itemType,
      isUrl: !!activity.originalUrl,
      categoryId: currentCategory.id
    })
  }

  const content = (
    <>
      <Tooltip>
        <div
          key={uniqueKey}
          className={`group flex w-full select-none items-center cursor-pointer justify-between px-1 py-0.5 ${borderRadiusClass} ${
            isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-muted'
          }`}
          onMouseEnter={() => setHoveredActivityKey(uniqueKey)}
          onMouseLeave={() => setHoveredActivityKey(null)}
        >
          <TooltipTrigger asChild>
            <div
              className="flex flex-1 items-center min-w-0"
              onClick={(e) => onSelectActivity(selectionKey, e)}
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
                {activity.name}
              </span>
            </div>
          </TooltipTrigger>
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
                activityKey={uniqueKey}
                setHoveredActivityKey={setHoveredActivityKey}
                onAddNewCategory={onAddNewCategory}
              />
            ) : (
              <span className="text-sm text-muted-foreground">
                {formatDuration(activity.durationMs)}
              </span>
            )}
          </div>
        </div>
        <TooltipContent className="max-w-xs text-muted-foreground sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
          <ul>
            <li>
              <strong className="text-primary">Name:</strong> {activity.name}
            </li>
            {activity.originalUrl && (
              <li className="whitespace-normal break-all">
                <strong className="text-primary">URL:</strong> {activity.originalUrl}
              </li>
            )}
            <li>
              <strong className="text-primary">Type:</strong> {activity.itemType}
            </li>
            {activity.llmSummary && (
              <li className="whitespace-normal break-all">
                <strong className="text-primary">AI Summary:</strong> {activity.llmSummary}
              </li>
            )}
            {activity.categoryReasoning && (
              <li className="whitespace-normal break-all">
                <strong className="text-primary">AI Reasoning:</strong> {activity.categoryReasoning}
              </li>
            )}
            {activity.oldCategoryReasoning && (
              <li className="whitespace-normal break-all">
                <strong className="text-primary">Old AI Reasoning:</strong>{' '}
                {activity.oldCategoryReasoning}
              </li>
            )}
            {activity.lastCategorizationAt && (
              <li>
                <strong className="text-primary">Categorized At:</strong>{' '}
                {new Date(activity.lastCategorizationAt).toLocaleString()}
              </li>
            )}
          </ul>
        </TooltipContent>
      </Tooltip>
    </>
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger>{content}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => handleDeleteActivity(activity)}>
          Delete Activity
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
