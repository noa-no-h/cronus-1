import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, PlusCircle, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { type Category } from 'shared/dist/types'
import { z } from 'zod'
import { useAuth } from '../../contexts/AuthContext'
import { TimeBlock } from '../../lib/dayTimelineHelpers'
import { trpc } from '../../utils/trpc'
import { CategoryForm } from '../Settings/CategoryForm'
import { templateCategories } from '../Settings/CategoryTemplateList'
import { Badge } from '../ui/badge'
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
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover'

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
  const {
    data: categories,
    isLoading,
    error
  } = trpc.category.getCategories.useQuery({ token: token || '' }, { enabled: !!token && isOpen })

  const utils = trpc.useUtils()
  const createCategoryMutation = trpc.category.createCategory.useMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = form

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Category[]>([])
  const [templateResults, setTemplateResults] = useState<typeof templateCategories>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!searchQuery.trim() || !categories || selectedCategory) {
      setSearchResults([])
      setTemplateResults([])
      setIsPopoverOpen(false)
      return
    }

    const lowerCaseQuery = searchQuery.toLowerCase()

    const filtered = (categories as Category[]).filter((cat) =>
      cat.name.toLowerCase().includes(lowerCaseQuery)
    )
    setSearchResults(filtered)

    const existingCategoryNames = new Set(
      (categories as Category[]).map((c) => c.name.toLowerCase())
    )
    const filteredTemplates = templateCategories.filter((template) => {
      const templateNameLower = template.name.toLowerCase()
      if (existingCategoryNames.has(templateNameLower)) {
        return false // Don't show template if category with same name exists
      }
      return (
        templateNameLower.includes(lowerCaseQuery) ||
        template.description?.toLowerCase().includes(lowerCaseQuery)
      )
    })
    setTemplateResults(filteredTemplates)

    setIsPopoverOpen(
      filtered.length > 0 ||
        filteredTemplates.length > 0 ||
        (searchQuery.trim() !== '' && !selectedCategory)
    )
    setHighlightedIndex(-1) // Reset highlight when search results change
  }, [searchQuery, categories, selectedCategory])

  useEffect(() => {
    // Sync form state when selectedCategory changes
    setValue('name', selectedCategory?.name || searchQuery)
    setValue('categoryId', selectedCategory?._id)
  }, [selectedCategory, searchQuery, setValue])

  useEffect(() => {
    // This effect is for resetting the form when it's opened for a new entry
    if (isOpen && !existingEntry) {
      reset()
      setSearchQuery('')
      setSelectedCategory(null)
      setShowCategoryForm(false)
    }
  }, [isOpen, existingEntry, reset])

  useEffect(() => {
    // This effect handles populating the form when editing an existing entry
    if (isOpen && existingEntry) {
      setSearchQuery(existingEntry.name)
      if (existingEntry.categoryId && categories) {
        const category = (categories as Category[]).find((c) => c._id === existingEntry.categoryId)
        setSelectedCategory(category || null)
      } else {
        setSelectedCategory(null)
      }
    }
  }, [isOpen, existingEntry, categories])

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category)
    setSearchQuery(category.name) // Update input field
    setIsPopoverOpen(false)
    inputRef.current?.focus()
  }

  const showCreateOption =
    searchQuery.trim() !== '' &&
    !searchResults.some((cat) => cat.name.toLowerCase() === searchQuery.toLowerCase()) &&
    !templateResults.some((template) => template.name.toLowerCase() === searchQuery.toLowerCase())

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isPopoverOpen) {
      const itemsCount = searchResults.length + templateResults.length + (showCreateOption ? 1 : 0)
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % itemsCount)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev - 1 + itemsCount) % itemsCount)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (highlightedIndex >= 0) {
          const userCategoriesCount = searchResults.length
          const templateCategoriesCount = templateResults.length

          if (highlightedIndex < userCategoriesCount) {
            // It's a user category
            handleSelectCategory(searchResults[highlightedIndex])
          } else if (highlightedIndex < userCategoriesCount + templateCategoriesCount) {
            // It's a template category
            const template = templateResults[highlightedIndex - userCategoriesCount]
            handleSaveNewCategory(template) // This calls the mutation
            setIsPopoverOpen(false)
          } else {
            // This is the "Create" option
            setIsPopoverOpen(false)
            setShowCategoryForm(true)
          }
        } else {
          handleSubmit(handleFormSubmit)()
        }
      } else if (e.key === 'Escape') {
        setIsPopoverOpen(false)
      }
    } else {
      // Allow form submission with Enter when popover is closed
      if (e.key === 'Enter') {
        handleSubmit(handleFormSubmit)()
      }
    }
  }

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    const finalName = searchQuery || values.name
    onSubmit({ name: finalName, categoryId: selectedCategory?._id })
    reset()
    setSearchQuery('')
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

      // Select the newly created category
      setSelectedCategory(newCategory)
      setSearchQuery(newCategory.name)

      // If the form was open, close it
      if (showCategoryForm) {
        setShowCategoryForm(false)
      }
    } catch (err) {
      // TODO: Replace with a more user-friendly notification
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
              initialData={{ name: searchQuery, isProductive: true }}
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
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <Popover open={isPopoverOpen && !existingEntry} onOpenChange={setIsPopoverOpen}>
                <div className="space-y-2">
                  <Label htmlFor="name">Entry or Category Name</Label>
                  <PopoverAnchor asChild>
                    <Input
                      id="name"
                      placeholder="e.g., Commuting, Gym, etc."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setSelectedCategory(null) // Clear selected category when typing
                      }}
                      onKeyDown={handleKeyDown}
                      ref={inputRef}
                      autoComplete="off"
                    />
                  </PopoverAnchor>
                  {errors.name && (
                    <p className="text-sm font-medium text-destructive">{errors.name.message}</p>
                  )}
                </div>
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
                        onClick={() => handleSelectCategory(cat)}
                        onMouseEnter={() => setHighlightedIndex(index)}
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
                        onClick={() => {
                          handleSaveNewCategory(template)
                          setIsPopoverOpen(false)
                        }}
                        onMouseEnter={() => setHighlightedIndex(searchResults.length + index)}
                        className={`flex items-center cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none ${
                          highlightedIndex === searchResults.length + index ? 'bg-accent' : ''
                        }`}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>
                          Create from template:{' '}
                          <span className="font-semibold">{template.name}</span>
                        </span>
                      </div>
                    ))}
                    {showCreateOption && (
                      <div
                        onClick={() => {
                          setIsPopoverOpen(false)
                          setShowCategoryForm(true)
                        }}
                        onMouseEnter={() =>
                          setHighlightedIndex(searchResults.length + templateResults.length)
                        }
                        className={`flex items-center cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none ${
                          highlightedIndex === searchResults.length + templateResults.length
                            ? 'bg-accent'
                            : ''
                        }`}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create category "{searchQuery}"
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {selectedCategory && (
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
                      onClick={() => {
                        setSelectedCategory(null)
                        setSearchQuery('')
                        inputRef.current?.focus()
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                </div>
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
