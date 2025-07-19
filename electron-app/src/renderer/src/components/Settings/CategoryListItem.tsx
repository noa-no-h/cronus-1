import {
  Archive,
  ArchiveRestore,
  Edit3,
  MoreHorizontal,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { JSX } from 'react'
import { Category } from 'shared/types'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'

interface CategoryListItemProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
  onToggleProductive: (category: Category) => void
  onToggleArchive: (category: Category) => void
  isDeleting: boolean
  isUpdating: boolean
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

export function CategoryListItem({
  category,
  onEdit,
  onToggleProductive,
  onToggleArchive,
  isDeleting,
  isUpdating
}: CategoryListItemProps): JSX.Element {
  const categoryEmoji = category.emoji || getDefaultEmojiForCategory(category.name)

  return (
    <div
      className="divide-border border rounded-lg px-4 py-4 sm:px-6 hover:bg-accent transition-colors"
      style={{
        backgroundColor: `${category.color}50`
      }}
    >
      <div className="flex items-center justify-between gap-x-4">
        <div className="flex items-center flex-1 min-w-0">
          <span className="text-lg mr-3 flex-shrink-0">{categoryEmoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-md font-medium text-foreground truncate">{category.name}</p>
            {category.description && (
              <p className="text-sm text-muted-foreground truncate">{category.description}</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(category)}
            className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background focus:ring-primary"
            title="Edit category"
            disabled={isUpdating}
          >
            <Edit3 size={18} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="p-1.5 rounded-full text-muted-foreground data-[state=open]:bg-primary/20 data-[state=open]:text-primary"
                disabled={isUpdating || isDeleting}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onToggleProductive(category)}
                disabled={isUpdating}
                className="flex items-center cursor-pointer"
              >
                {category.isProductive ? (
                  <ToggleRight size={18} className="mr-2 text-green-500" />
                ) : (
                  <ToggleLeft size={18} className="mr-2 text-red-500" />
                )}
                <span>
                  {category.isProductive ? 'Mark as non-productive' : 'Mark as productive'}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleArchive(category)}
                disabled={isUpdating}
                className="flex items-center cursor-pointer"
              >
                {category.isArchived ? (
                  <ArchiveRestore size={18} className="mr-2" />
                ) : (
                  <Archive size={18} className="mr-2" />
                )}
                <span>{category.isArchived ? 'Unarchive' : 'Archive'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
