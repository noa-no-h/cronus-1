import { ChevronDownIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion } from 'framer-motion'
import { Category as SharedCategory } from 'shared'
import { ActivityItem, ProcessedCategory } from '../../lib/activityProcessing'
import { Button } from '../ui/button'
import { ActivityListItem } from './ActivityListItem'

interface ActivityListProps {
  activities: ActivityItem[]
  currentCategory: ProcessedCategory
  allUserCategories: SharedCategory[] | undefined
  handleMoveActivity: (activity: ActivityItem, targetCategoryId: string) => void
  isMovingActivity: boolean
  faviconErrors: Set<string>
  handleFaviconError: (identifier: string) => void
  isShowMore: boolean
  onToggleShowMore: () => void
  hoveredActivityKey: string | null
  setHoveredActivityKey: (key: string | null) => void
  openDropdownActivityKey: string | null
  setOpenDropdownActivityKey: (key: string | null) => void
  selectedHour: number | null
  selectedDay: Date | null
  viewMode: 'day' | 'week'
  startDateMs: number | null
  endDateMs: number | null
  selectedActivities: Set<string>
  onSelectActivity: (activityKey: string, event: React.MouseEvent) => void
}

export const ActivityList = ({
  activities,
  currentCategory,
  allUserCategories,
  handleMoveActivity,
  isMovingActivity,
  faviconErrors,
  handleFaviconError,
  isShowMore,
  onToggleShowMore,
  hoveredActivityKey,
  setHoveredActivityKey,
  openDropdownActivityKey,
  setOpenDropdownActivityKey,
  selectedHour,
  selectedDay,
  viewMode,
  startDateMs,
  endDateMs,
  selectedActivities,
  onSelectActivity
}: ActivityListProps) => {
  const oneMinuteMs = 60 * 1000
  const visibleActivities = activities.filter((act) => act.durationMs >= oneMinuteMs)
  const hiddenActivities = activities.filter((act) => act.durationMs < oneMinuteMs)

  // If all activities are below 1 minute, show them all directly
  const shouldShowAllActivities = visibleActivities.length === 0 && hiddenActivities.length > 0
  const activitiesToShow = shouldShowAllActivities ? activities : visibleActivities
  const activitiesToHide = shouldShowAllActivities ? [] : hiddenActivities

  const renderItems = (items: ActivityItem[]) => {
    const validItems = items.filter((activity) => {
      if (activity.itemType === 'website' && !activity.originalUrl) {
        // This is the problematic entry, let's not render it for now.
        return false
      }
      return true
    })

    return validItems.map((activity, index) => {
      const activityKey = `${activity.identifier}-${activity.name}`
      const isSelected = selectedActivities.has(activityKey)

      const prevItem = validItems[index - 1]
      const nextItem = validItems[index + 1]

      const prevActivityKey = prevItem ? `${prevItem.identifier}-${prevItem.name}` : null
      const nextActivityKey = nextItem ? `${nextItem.identifier}-${nextItem.name}` : null

      const isPrevSelected = prevActivityKey ? selectedActivities.has(prevActivityKey) : false
      const isNextSelected = nextActivityKey ? selectedActivities.has(nextActivityKey) : false

      return (
        <ActivityListItem
          key={activityKey}
          activity={activity}
          isSelected={isSelected}
          isPrevSelected={isPrevSelected}
          isNextSelected={isNextSelected}
          currentCategory={currentCategory}
          allUserCategories={allUserCategories}
          handleMoveActivity={handleMoveActivity}
          isMovingActivity={isMovingActivity}
          faviconErrors={faviconErrors}
          handleFaviconError={handleFaviconError}
          hoveredActivityKey={hoveredActivityKey}
          setHoveredActivityKey={setHoveredActivityKey}
          openDropdownActivityKey={openDropdownActivityKey}
          setOpenDropdownActivityKey={setOpenDropdownActivityKey}
          onSelectActivity={onSelectActivity}
          selectedHour={selectedHour}
          selectedDay={selectedDay}
          viewMode={viewMode}
          startDateMs={startDateMs}
          endDateMs={endDateMs}
        />
      )
    })
  }

  return (
    <>
      {renderItems(activitiesToShow)}
      {activitiesToHide.length > 0 && (
        <Button
          variant="link"
          className="p-1 px-2 mt-2 w-full h-auto text-xs text-left justify-start text-slate-600 dark:text-slate-400 hover:text-foreground transition-colors flex items-center gap-1"
          onClick={onToggleShowMore}
        >
          {isShowMore ? 'Show less' : `Show ${activitiesToHide.length} more`}
          <ChevronDownIcon
            className={`ml-.5 h-4 w-4 transition-transform duration-200 ${
              isShowMore ? 'rotate-180' : ''
            }`}
          />
        </Button>
      )}
      <AnimatePresence>
        {isShowMore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {renderItems(activitiesToHide)}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
