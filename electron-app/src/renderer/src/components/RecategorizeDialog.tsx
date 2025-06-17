import React from 'react'
import { Category } from 'shared'
import type { ActivityToRecategorize } from '../App'
import { ActivityIcon } from './ActivityIcon'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'

interface RecategorizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activityTarget: ActivityToRecategorize | null
  allCategories: Category[]
  onSave: (newCategoryId: string) => void
  isLoading: boolean
}

const RecategorizeDialog: React.FC<RecategorizeDialogProps> = ({
  open,
  onOpenChange,
  activityTarget,
  allCategories,
  onSave,
  isLoading
}) => {
  if (!activityTarget) {
    return null
  }

  const handleCategorySelectAndSave = (categoryId: string) => {
    if (!isLoading) {
      onSave(categoryId)
    }
  }

  const availableCategories = allCategories.filter(
    (cat) => cat._id !== activityTarget.currentCategoryId
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Re-categorize Activity</DialogTitle>
          <DialogDescription className="flex flex-col gap-2">
            <div className="pt-2">
              Change target:{' '}
              <ActivityIcon
                url={activityTarget.originalUrl}
                appName={activityTarget.identifier}
                size={16}
                className="inline-block align-middle"
                itemType={activityTarget.originalUrl ? 'website' : 'app'}
                color={activityTarget.currentCategoryColor}
                onFaviconError={() => {}}
                showFallback={false}
                fallbackText={activityTarget.identifier.charAt(0).toUpperCase()}
              />{' '}
              <strong className="text-primary">{activityTarget.nameToDisplay}</strong>
            </div>
            <p>
              Currently categorized as{' '}
              <span
                className="w-4 h-4 rounded-full inline-block align-middle mr-1 mb-[4px]"
                style={{ backgroundColor: activityTarget.currentCategoryColor }}
              ></span>
              <strong className="text-primary">{activityTarget.currentCategoryName}</strong>
            </p>
          </DialogDescription>
        </DialogHeader>

        <div>
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">Move to Category:</h4>
          {availableCategories.length > 0 ? (
            <div className="flex flex-wrap items-start gap-2">
              {availableCategories.map((cat) => (
                <Button
                  key={cat._id}
                  variant={'outline'}
                  onClick={() => handleCategorySelectAndSave(cat._id)}
                  disabled={isLoading}
                  size="sm"
                  style={{
                    borderColor: cat.color
                  }}
                  className={`border-2 hover:bg-[${cat.color}]/10`}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No other categories available to move to.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RecategorizeDialog
