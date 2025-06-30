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

export function CategoryListItem({
  category,
  onEdit,
  onDelete,
  onToggleProductive,
  onToggleArchive,
  isDeleting,
  isUpdating
}: CategoryListItemProps): JSX.Element {
  return (
    <li className="px-4 py-4 sm:px-6 hover:bg-accent transition-colors">
      <div className="flex items-center justify-between gap-x-4">
        <div className="flex items-center flex-1 min-w-0">
          <span
            style={{ backgroundColor: category.color }}
            className="w-4 h-4 rounded-full mr-3 flex-shrink-0 border border-border"
          ></span>
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
              {/* <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  alert(
                    'Deleting categories is not implemented yet. We are planning to add this and a smart activity-recategorization feature next :)'
                  )
                }}
                disabled={isDeleting}
                className="flex items-center text-destructive focus:text-destructive cursor-pointer"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 size={18} className="mr-2" />
                )}
                <span>Delete</span>
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  )
}
