import { PlusCircle } from 'lucide-react'
import { type ComparableCategory } from 'shared/categories'
import { type Category } from 'shared/dist/types'
import { PopoverContent } from '../ui/popover'

interface CategorySelectionPopoverProps {
  searchResults: Category[]
  templateResults: ComparableCategory[]
  highlightedIndex: number
  showCreateOption: boolean
  inputValue: string
  onSelectCategory: (category: Category) => void
  onSelectTemplate: (template: ComparableCategory) => void
  onShowCategoryForm: () => void
  onHighlight: (index: number) => void
}

export const CategorySelectionPopover = ({
  searchResults,
  templateResults,
  highlightedIndex,
  showCreateOption,
  inputValue,
  onSelectCategory,
  onSelectTemplate,
  onShowCategoryForm,
  onHighlight
}: CategorySelectionPopoverProps) => {
  return (
    <PopoverContent
      className="w-[var(--radix-popover-trigger-width)] p-0"
      side="bottom"
      align="start"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <div className="flex flex-col space-y-1 p-1">
        {searchResults.map((cat, index) => (
          <div
            key={cat._id}
            onClick={() => onSelectCategory(cat)}
            onMouseEnter={() => onHighlight(index)}
            className={`flex items-center cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none ${
              highlightedIndex === index ? 'bg-accent' : ''
            }`}
          >
            <span
              className="mr-2 h-2 w-2 rounded-full"
              style={{ backgroundColor: cat.color }}
            ></span>
            {cat.name}
          </div>
        ))}
        {templateResults.map((template, index) => (
          <div
            key={template.name}
            onClick={() => onSelectTemplate(template)}
            onMouseEnter={() => onHighlight(searchResults.length + index)}
            className={`flex items-center cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none ${
              highlightedIndex === searchResults.length + index ? 'bg-accent' : ''
            }`}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>
              Create from template: <span className="font-semibold">{template.name}</span>
            </span>
          </div>
        ))}
        {showCreateOption && (
          <div
            onClick={onShowCategoryForm}
            onMouseEnter={() => onHighlight(searchResults.length + templateResults.length)}
            className={`flex items-center cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none ${
              highlightedIndex === searchResults.length + templateResults.length ? 'bg-accent' : ''
            }`}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create category "{inputValue}"
          </div>
        )}
      </div>
    </PopoverContent>
  )
}
