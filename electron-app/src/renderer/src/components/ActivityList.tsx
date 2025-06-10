import { ChevronDownIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion } from 'framer-motion'
import { Category as SharedCategory } from 'shared'
import { formatDuration } from '../lib/activityByCategoryWidgetHelpers'
import { ActivityItem, ProcessedCategory } from '../lib/activityProcessing'
import { getFaviconURL } from '../utils/favicon'
import AppIcon from './AppIcon'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

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
  setOpenDropdownActivityKey
}: ActivityListProps) => {
  const oneMinuteMs = 60 * 1000
  const visibleActivities = activities.filter((act) => act.durationMs >= oneMinuteMs)
  const hiddenActivities = activities.filter((act) => act.durationMs < oneMinuteMs)

  const renderItems = (items: ActivityItem[]) => {
    return items.map((activity) => {
      const activityKey = `${activity.identifier}-${activity.name}`
      const otherCategories =
        allUserCategories?.filter((cat) => cat._id !== currentCategory.id) || []
      const showMoveUI =
        (hoveredActivityKey === activityKey || openDropdownActivityKey === activityKey) &&
        otherCategories.length > 0

      return (
        <div
          key={activityKey}
          className="flex items-center justify-between py-0.5 group w-full hover:bg-muted rounded-md px-2"
          onMouseEnter={() => setHoveredActivityKey(activityKey)}
          onMouseLeave={() => setHoveredActivityKey(null)}
        >
          <div className="flex items-center flex-1 min-w-0">
            {activity.itemType === 'website' && activity.originalUrl ? (
              !faviconErrors.has(activity.identifier) ? (
                <img
                  src={getFaviconURL(activity.originalUrl)}
                  alt={activity.identifier.charAt(0).toUpperCase()} // More descriptive alt
                  width={16}
                  height={16}
                  className="mr-2 flex-shrink-0 rounded"
                  onError={() => handleFaviconError(activity.identifier)}
                />
              ) : (
                <div className="w-4 h-4 flex items-center justify-center bg-muted text-muted-foreground rounded text-xs mr-2 flex-shrink-0">
                  {activity.identifier.charAt(0).toUpperCase()}
                </div>
              )
            ) : activity.itemType === 'app' ? (
              <AppIcon appName={activity.identifier} size={16} className="mr-2 flex-shrink-0" />
            ) : (
              <span
                className={`w-2 p-2 h-2 rounded-full mr-2 flex-shrink-0`}
                style={{ backgroundColor: currentCategory.color }}
              ></span>
            )}
            <span
              className="text-sm text-foreground cursor-pointer block truncate"
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
            {showMoveUI && (
              <>
                {otherCategories.length === 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-5 px-2 py-1 text-xs"
                    onClick={() => handleMoveActivity(activity, otherCategories[0]._id)}
                    disabled={isMovingActivity}
                  >
                    {isMovingActivity
                      ? 'Moving...'
                      : `Move: ${otherCategories[0].name.substring(0, 10)}${
                          otherCategories[0].name.length > 10 ? '...' : ''
                        }`}
                  </Button>
                ) : (
                  <DropdownMenu
                    open={openDropdownActivityKey === activityKey}
                    onOpenChange={(isOpen) => {
                      setOpenDropdownActivityKey(isOpen ? activityKey : null)
                      // If closing, also clear hover to prevent immediate re-show if mouse is still over row
                      if (!isOpen) {
                        setHoveredActivityKey(null)
                      }
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-5 px-2 py-1 text-xs">
                        Move to...
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
                      {otherCategories.map((targetCat) => (
                        <DropdownMenuItem
                          key={targetCat._id}
                          onClick={() => {
                            handleMoveActivity(activity, targetCat._id)
                          }}
                          disabled={isMovingActivity}
                        >
                          {targetCat.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
            {!showMoveUI && (
              <span className="text-sm text-muted-foreground">
                {formatDuration(activity.durationMs)}
              </span>
            )}
          </div>
        </div>
      )
    })
  }

  return (
    <>
      {renderItems(visibleActivities)}
      {hiddenActivities.length > 0 && (
        <Button
          variant="link"
          className="p-1 mt-2 w-full h-auto text-xs text-left justify-start text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          onClick={onToggleShowMore}
        >
          {isShowMore ? 'Show less' : `Show ${hiddenActivities.length} more`}
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
            {renderItems(hiddenActivities)}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
