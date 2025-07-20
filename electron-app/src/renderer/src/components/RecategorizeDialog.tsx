import { PlusCircle } from 'lucide-react'
import React from 'react'
import { Category } from 'shared'
import type { ActivityToRecategorize } from '../App'
import { useDarkMode } from '../hooks/useDarkMode'
import { getDarkerColor, getLighterColor, hexToRgba } from '../lib/colors'
import { ActivityIcon } from './ActivityList/ActivityIcon'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

interface RecategorizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activityTarget: ActivityToRecategorize | null
  allCategories: Category[]
  onSave: (newCategoryId: string) => void
  isLoading: boolean
  onAddNewCategory: () => void
}

const RecategorizeDialog: React.FC<RecategorizeDialogProps> = ({
  open,
  onOpenChange,
  activityTarget,
  allCategories,
  onSave,
  isLoading,
  onAddNewCategory
}) => {
  const isDarkMode = useDarkMode()

  if (!activityTarget) {
    return null
  }

  const handleCategorySelectAndSave = (categoryId: string) => {
    if (!isLoading) {
      onSave(categoryId)
    }
  }

  const availableCategories = allCategories.filter(
    (cat) => cat._id !== activityTarget.currentCategoryId && !cat.isArchived
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Re-categorize Activity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="pt-2 flex items-center">
              <span className="text-muted-foreground mr-2 flex-shrink-0">Change target:</span>
              <ActivityIcon
                url={activityTarget.originalUrl}
                appName={activityTarget.identifier}
                size={16}
                className="inline-block align-middle mr-2 flex-shrink-0"
                itemType={activityTarget.originalUrl ? 'website' : 'app'}
                color={activityTarget.currentCategoryColor}
                showFallback={false}
                fallbackText={activityTarget.identifier.charAt(0).toUpperCase()}
              />
              <div className="truncate w-80">
                <strong className="text-primary ">{activityTarget.nameToDisplay}</strong>
              </div>
            </div>
            <div className="text-muted-foreground">
              Currently categorized as{' '}
              <span
                className="w-4 h-4 rounded-full inline-block align-middle mr-1 mb-[4px]"
                style={{ backgroundColor: activityTarget.currentCategoryColor }}
              ></span>
              <strong className="text-primary">{activityTarget.currentCategoryName}</strong>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">Move to Category:</h4>
            {availableCategories.length > 0 ? (
              <div className="flex flex-wrap items-start gap-2">
                <Button
                  variant="outline"
                  onClick={onAddNewCategory}
                  disabled={isLoading}
                  size="sm"
                  className="border-2 border-dashed border-muted-foreground/50 hover:border-muted-foreground"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Create new category
                </Button>
                {availableCategories.map((cat) => {
                  const textColor = cat.color
                    ? isDarkMode
                      ? getLighterColor(cat.color, 0.8)
                      : getDarkerColor(cat.color, 0.6)
                    : undefined
                  // Use lighter color for background
                  const backgroundColor = cat.color
                    ? isDarkMode
                      ? hexToRgba(cat.color, 0.3)
                      : hexToRgba(cat.color, 0.1)
                    : undefined

                  return (
                    <Button
                      key={cat._id}
                      variant={'outline'}
                      onClick={() => handleCategorySelectAndSave(cat._id)}
                      disabled={isLoading}
                      size="sm"
                      style={{
                        backgroundColor,
                        color: textColor
                      }}
                      className={`hover:opacity-80`}
                    >
                      {cat.emoji} {cat.name}
                    </Button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  No other categories available to move to.
                </div>
                <Button
                  variant="outline"
                  onClick={onAddNewCategory}
                  disabled={isLoading}
                  size="sm"
                  className="border-2 border-dashed border-muted-foreground/50 hover:border-muted-foreground"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Create new category
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RecategorizeDialog
