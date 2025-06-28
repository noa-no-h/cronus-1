import { Category as SharedCategory } from 'shared'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'

interface MoveSelectedActivitiesButtonProps {
  otherCategories: SharedCategory[]
  handleMove: (targetCategoryId: string) => void
  isMoving: boolean
}

export const MoveSelectedActivitiesButton = ({
  otherCategories,
  handleMove,
  isMoving
}: MoveSelectedActivitiesButtonProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 px-2 py-1 text-xs" disabled={isMoving}>
          {isMoving ? 'Moving...' : 'Move selected'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {otherCategories.map((targetCat) => (
          <DropdownMenuItem
            key={targetCat._id}
            onClick={() => handleMove(targetCat._id)}
            disabled={isMoving}
          >
            {targetCat.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
