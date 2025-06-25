import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { type Category } from 'shared/dist/types'
import { z } from 'zod'
import { useAuth } from '../../contexts/AuthContext'
import { TimeBlock } from '../../lib/dayTimelineHelpers'
import { trpc } from '../../utils/trpc'
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
  const { data: categories, isLoading } = trpc.category.getCategories.useQuery(
    { token: token || '' },
    { enabled: !!token && isOpen }
  )

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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!searchQuery.trim() || !categories || selectedCategory) {
      setSearchResults([])
      setIsPopoverOpen(false)
      return
    }

    const filtered = (categories as Category[]).filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setSearchResults(filtered)
    setIsPopoverOpen(filtered.length > 0)
    setHighlightedIndex(-1) // Reset highlight when search results change
  }, [searchQuery, categories, selectedCategory])

  useEffect(() => {
    // Sync form state when selectedCategory changes
    setValue('name', selectedCategory?.name || searchQuery)
    setValue('categoryId', selectedCategory?._id)
  }, [selectedCategory, searchQuery, setValue])

  useEffect(() => {
    if (existingEntry) {
      setSearchQuery(existingEntry.name)
      if (existingEntry.categoryId && categories) {
        const category = (categories as Category[]).find((c) => c._id === existingEntry.categoryId)
        if (category) {
          setSelectedCategory(category)
        }
      }
    }
  }, [existingEntry, categories])

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category)
    setSearchQuery(category.name) // Update input field
    setIsPopoverOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isPopoverOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % searchResults.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (highlightedIndex >= 0) {
          handleSelectCategory(searchResults[highlightedIndex])
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
                  placeholder="e.g., Commuting"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
      </DialogContent>
    </Dialog>
  )
}
