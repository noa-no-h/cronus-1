import { History, PlusCircle } from 'lucide-react'
import { type ComparableCategory } from 'shared/categories'
import { type Category } from 'shared/dist/types'
import { PopoverContent } from '../ui/popover'

type HistoryItem = {
  title: string | null
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
}

interface CategorySelectionPopoverProps {
  historyResults: HistoryItem[] | undefined
  searchResults: Category[]
  templateResults: ComparableCategory[]
  highlightedIndex: number
  showCreateOption: boolean
  inputValue: string
  onSelectHistory: (item: HistoryItem) => void
  onSelectCategory: (category: Category) => void
  onSelectTemplate: (template: ComparableCategory) => void
  onShowCategoryForm: () => void
  onHighlight: (index: number) => void
}

export const CategorySelectionPopover = ({
  historyResults,
  searchResults: searchCategoryResults,
  templateResults,
  highlightedIndex,
  showCreateOption,
  inputValue,
  onSelectHistory,
  onSelectCategory,
  onSelectTemplate,
  onShowCategoryForm,
  onHighlight
}: CategorySelectionPopoverProps) => {
  console.log('historyResults in CategorySelectionPopover', historyResults)

  return (
    <PopoverContent
      className="w-[var(--radix-popover-trigger-width)] p-0"
      side="bottom"
      align="start"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <div className="max-h-60 overflow-y-auto flex flex-col space-y-1 p-1">
        {historyResults && historyResults.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">History</div>
            {historyResults.map((item, index) => (
              <div
                key={`${item.title}-${item.categoryId}`}
                onClick={() => onSelectHistory(item)}
                onMouseEnter={() => onHighlight(index)}
                className={`flex items-center cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none ${
                  highlightedIndex === index ? 'bg-accent' : ''
                }`}
              >
                <History className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-semibold">{item.title}</span>
                  {item.categoryName && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span
                        className="mr-1.5 h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.categoryColor || '#808080' }}
                      ></span>
                      {item.categoryName}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
        {searchCategoryResults.map((cat, index) => (
          <div
            key={cat._id}
            onClick={() => onSelectCategory(cat)}
            onMouseEnter={() => onHighlight(index + (historyResults?.length || 0))}
            className={`flex items-center cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none ${
              highlightedIndex === index + (historyResults?.length || 0) ? 'bg-accent' : ''
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
            onMouseEnter={() =>
              onHighlight(searchCategoryResults.length + index + (historyResults?.length || 0))
            }
            className={`flex items-center cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none ${
              highlightedIndex ===
              searchCategoryResults.length + index + (historyResults?.length || 0)
                ? 'bg-accent'
                : ''
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
            onMouseEnter={() =>
              onHighlight(
                searchCategoryResults.length +
                  templateResults.length +
                  (historyResults?.length || 0)
              )
            }
            className={`flex items-center cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none ${
              highlightedIndex ===
              searchCategoryResults.length + templateResults.length + (historyResults?.length || 0)
                ? 'bg-accent'
                : ''
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
