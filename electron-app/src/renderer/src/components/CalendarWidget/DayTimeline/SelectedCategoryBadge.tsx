import { X } from 'lucide-react'
import { type Category } from 'shared/dist/types'
import { Badge } from '../../ui/badge'
import { Label } from '../../ui/label'

interface SelectedCategoryBadgeProps {
  selectedCategory: Category
  onClear: () => void
}

export const SelectedCategoryBadge = ({
  selectedCategory,
  onClear
}: SelectedCategoryBadgeProps) => {
  return (
    <div className="flex flex-row gap-4 items-center">
      <Label>Selected Category</Label>
      <Badge variant="outline" className="flex w-fit items-center">
        <span
          className="mr-2 h-2 w-2 rounded-full"
          style={{ backgroundColor: selectedCategory.color }}
        ></span>
        {selectedCategory.name}
        <button
          type="button"
          className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={onClear}
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </button>
      </Badge>
    </div>
  )
}
