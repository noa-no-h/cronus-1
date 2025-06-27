import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { type Category } from 'shared/dist/types'
import { z } from 'zod'
import { useAuth } from '../../contexts/AuthContext'
import { useCategorySelection } from '../../hooks/useCategorySelection'
import { TimeBlock } from '../../lib/dayTimelineHelpers'
import { trpc } from '../../utils/trpc'
import { CategoryForm } from '../Settings/CategoryForm'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Popover, PopoverAnchor } from '../ui/popover'
import { CategorySelectionPopover } from './CategorySelectionPopover'
import { SelectedCategoryBadge } from './SelectedCategoryBadge'

interface CreateEntryModalProps {
  isOpen: boolean
  onClose: () => void
  startTime: { hour: number; minute: number } | null
  endTime: { hour: number; minute: number } | null
  onSubmit: (data: { name: string; categoryId?: string }) => void
  onDelete: (id: string) => void
  existingEntry: TimeBlock | null
}

const formSchema = z.object({
  name: z.string().min(1, 'Entry name is required'),
  categoryId: z.string().optional()
})

export const CreateEntryModal = ({
  isOpen,
  onClose,
  startTime,
  endTime,
  onSubmit,
  onDelete,
  existingEntry
}: CreateEntryModalProps) => {
  const { token } = useAuth()
  const { data: categoriesData, isLoading } = trpc.category.getCategories.useQuery(
    { token: token || '' },
    { enabled: !!token && isOpen }
  )

  const categories = useMemo(() => {
    if (!categoriesData) return []
    return categoriesData.map((cat) => ({
      ...cat,
      createdAt: new Date(cat.createdAt),
      updatedAt: new Date(cat.updatedAt)
    }))
  }, [categoriesData])

  const utils = trpc.useUtils()
  const createCategoryMutation = trpc.category.createCategory.useMutation()

  const {
    formState: { errors, isSubmitting },
    reset
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  })

  const [inputValue, setInputValue] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    searchResults,
    templateResults,
    isPopoverOpen,
    setIsPopoverOpen,
    highlightedIndex,
    setHighlightedIndex,
    showCreateOption,
    handleKeyDown
  } = useCategorySelection({
    categories,
    inputValue,
    selectedCategory
  })

  useEffect(() => {
    // This effect is for resetting the form when it's opened for a new entry
    if (isOpen && !existingEntry) {
      reset()
      setInputValue('')
      setSelectedCategory(null)
      setShowCategoryForm(false)
    }
  }, [isOpen, existingEntry, reset])

  useEffect(() => {
    // This effect handles populating the form when editing an existing entry
    if (isOpen && existingEntry) {
      setInputValue(existingEntry.name)
      if (existingEntry.categoryId && categories) {
        const category = categories.find((c) => c._id === existingEntry.categoryId)
        setSelectedCategory(category || null)
      } else {
        setSelectedCategory(null)
      }
    }
  }, [isOpen, existingEntry, categories])

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category)
    setInputValue('') // Clear input to allow typing the title
    setIsPopoverOpen(false)
    inputRef.current?.focus()
  }

  const handleFormSubmit = () => {
    if (!inputValue && !selectedCategory) {
      return
    }
    const finalName = inputValue || selectedCategory?.name || 'Untitled'
    onSubmit({ name: finalName, categoryId: selectedCategory?._id })
    reset()
    setInputValue('')
    setSelectedCategory(null)
  }

  const handleSaveNewCategory = async (
    data: Omit<Category, '_id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!token) return
    try {
      const newCategory = (await createCategoryMutation.mutateAsync({
        ...data,
        token
      })) as Category
      utils.category.getCategories.invalidate({ token: token || '' })

      setSelectedCategory(newCategory)
      setInputValue('') // Clear input after creating and selecting category

      if (showCategoryForm) {
        setShowCategoryForm(false)
      }
    } catch (err) {
      alert(`Error creating category: ${(err as Error).message}`)
    }
  }

  const formatTime = (time: { hour: number; minute: number }) => {
    return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
  }

  const getDialogDescription = () => {
    if (existingEntry) {
      return `Editing entry: ${existingEntry.name}`
    }
    if (startTime && endTime) {
      return `Adding a new entry from ${formatTime(startTime)} to ${formatTime(endTime)}.`
    }
    return ''
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {showCategoryForm ? (
          <>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Create a new category to organize your time entries.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              initialData={{ name: inputValue, isProductive: true }}
              onSave={handleSaveNewCategory}
              onCancel={() => setShowCategoryForm(false)}
              isSaving={createCategoryMutation.isLoading}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{existingEntry ? 'Edit Entry' : 'Create New Entry'}</DialogTitle>
              <DialogDescription>{getDialogDescription()}</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleFormSubmit()
              }}
              className="space-y-4"
            >
              <Popover open={isPopoverOpen && !existingEntry} onOpenChange={setIsPopoverOpen}>
                <div className="space-y-2">
                  <Label htmlFor="name">Entry Title or Category Search</Label>
                  <PopoverAnchor asChild>
                    <Input
                      id="name"
                      placeholder="Search for a category or type a title"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value)
                      }}
                      onKeyDown={(e) =>
                        handleKeyDown(
                          e,
                          handleSelectCategory,
                          (template) => {
                            handleSaveNewCategory(template)
                            setIsPopoverOpen(false)
                          },
                          () => {
                            setIsPopoverOpen(false)
                            setShowCategoryForm(true)
                          },
                          handleFormSubmit
                        )
                      }
                      ref={inputRef}
                      autoComplete="off"
                    />
                  </PopoverAnchor>
                  {errors.name && (
                    <p className="text-sm font-medium text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <CategorySelectionPopover
                  searchResults={searchResults}
                  templateResults={templateResults}
                  highlightedIndex={highlightedIndex}
                  showCreateOption={showCreateOption}
                  inputValue={inputValue}
                  onSelectCategory={handleSelectCategory}
                  onSelectTemplate={(template) => {
                    handleSaveNewCategory(template)
                    setIsPopoverOpen(false)
                  }}
                  onShowCategoryForm={() => {
                    setIsPopoverOpen(false)
                    setShowCategoryForm(true)
                  }}
                  onHighlight={setHighlightedIndex}
                />
              </Popover>

              {selectedCategory && (
                <SelectedCategoryBadge
                  selectedCategory={selectedCategory}
                  onClear={() => {
                    setSelectedCategory(null)
                    setInputValue(selectedCategory?.name || '')
                    inputRef.current?.focus()
                  }}
                />
              )}

              <DialogFooter>
                {existingEntry && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (existingEntry._id) {
                        onDelete(existingEntry._id)
                      }
                    }}
                    className="mr-auto"
                  >
                    Delete
                  </Button>
                )}
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {existingEntry ? 'Save' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
