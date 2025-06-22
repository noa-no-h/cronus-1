import { Category as SharedCategory } from 'shared'
import { getTimeRangeDescription } from '../../lib/activityMoving'
import { ActivityItem } from '../../lib/activityProcessing'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface MoveActivityButtonProps {
  activity: ActivityItem
  otherCategories: SharedCategory[]
  handleMoveActivity: (activity: ActivityItem, targetCategoryId: string) => void
  isMovingActivity: boolean
  selectedHour: number | null
  selectedDay: Date | null
  viewMode: 'day' | 'week'
  startDateMs: number | null
  endDateMs: number | null
  openDropdownActivityKey: string | null
  setOpenDropdownActivityKey: (key: string | null) => void
  activityKey: string
  setHoveredActivityKey: (key: string | null) => void
}

export const MoveActivityButton = ({
  activity,
  otherCategories,
  handleMoveActivity,
  isMovingActivity,
  selectedHour,
  selectedDay,
  viewMode,
  startDateMs,
  endDateMs,
  openDropdownActivityKey,
  setOpenDropdownActivityKey,
  activityKey,
  setHoveredActivityKey
}: MoveActivityButtonProps) => {
  if (otherCategories.length === 1) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-5 px-2 py-1 text-xs"
        onClick={(e) => {
          e.stopPropagation()
          handleMoveActivity(activity, otherCategories[0]._id)
        }}
        disabled={isMovingActivity}
      >
        {isMovingActivity
          ? 'Moving...'
          : `Move: ${otherCategories[0].name.substring(0, 10)}${
              otherCategories[0].name.length > 10 ? '...' : ''
            }`}
      </Button>
    )
  }

  return (
    <DropdownMenu
      open={openDropdownActivityKey === activityKey}
      onOpenChange={(isOpen) => {
        setOpenDropdownActivityKey(isOpen ? activityKey : null)
        if (!isOpen) {
          setHoveredActivityKey(null)
        }
      }}
    >
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-5 px-2 py-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                Move to...
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            Move this activity to another category{' '}
            {getTimeRangeDescription(selectedHour, selectedDay, viewMode, startDateMs, endDateMs)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
        {otherCategories.map((targetCat) => (
          <DropdownMenuItem
            key={targetCat._id}
            onClick={(e) => {
              e.stopPropagation()
              handleMoveActivity(activity, targetCat._id)
            }}
            disabled={isMovingActivity}
          >
            {targetCat.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
