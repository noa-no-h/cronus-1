import React from 'react'
import { Category } from 'shared'
import type { ActivityToRecategorize } from '../App'
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
            <div>
              Change the category for <strong>{activityTarget.nameToDisplay}</strong>
            </div>
            <div>
              Currently categorized as <strong>{activityTarget.currentCategoryName}</strong>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
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
                  className={`hover:bg-[${cat.color}]/10`}
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
