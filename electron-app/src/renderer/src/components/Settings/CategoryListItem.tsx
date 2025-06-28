import {
  Archive,
  ArchiveRestore,
  Edit3,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Trash2
} from 'lucide-react'
import { JSX } from 'react'
import { Category } from 'shared/types'
import { Button } from '../ui/button'
import { IsProductiveTooltip } from './IsProductiveTooltip'

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
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span
            style={{ backgroundColor: category.color }}
            className="w-4 h-4 rounded-full mr-3 flex-shrink-0 border border-border"
          ></span>
          <div>
            <p className="text-md font-medium text-foreground truncate">{category.name}</p>
            {category.description && (
              <p className="text-sm text-muted-foreground truncate max-w-xs">
                {category.description}
              </p>
            )}
          </div>
        </div>
        <div className="ml-2 flex-shrink-0 flex items-center space-x-2 sm:space-x-3">
          <IsProductiveTooltip>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleProductive(category)}
              className={`p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background ${
                category.isProductive
                  ? 'text-green-500 hover:bg-green-500/20 focus:ring-green-500'
                  : 'text-red-500 hover:bg-red-500/20 focus:ring-red-500'
              }`}
              disabled={isUpdating}
            >
              {category.isProductive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            </Button>
          </IsProductiveTooltip>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleArchive(category)}
            title={category.isArchived ? 'Unarchive' : 'Archive'}
            className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background focus:ring-primary"
            disabled={isUpdating}
          >
            {category.isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
          </Button>

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

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              alert(
                'Deleting categories is not implemented yet. We are planning to add this and a smart activity-recategorization feature next :)'
              )

              // if (window.confirm('Are you sure you want to delete this category?')) {
              //   onDelete(category._id)
              // }
            }}
            disabled={isDeleting}
            className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background focus:ring-destructive disabled:opacity-50"
            title="Delete category"
          >
            {isDeleting ? (
              <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
            ) : (
              <Trash2 size={18} />
            )}
          </Button>
        </div>
      </div>
    </li>
  )
}
