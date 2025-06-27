import { useEffect, useState } from 'react'
import { type Category } from 'shared/dist/types'
import { templateCategories } from '../components/Settings/CategoryTemplateList'

interface UseCategorySelectionProps {
  categories: Category[]
  inputValue: string
  selectedCategory: Category | null
}

export const useCategorySelection = ({
  categories,
  inputValue,
  selectedCategory
}: UseCategorySelectionProps) => {
  const [searchResults, setSearchResults] = useState<Category[]>([])
  const [templateResults, setTemplateResults] = useState<typeof templateCategories>([])
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  useEffect(() => {
    if (!inputValue.trim() || !categories || selectedCategory) {
      setSearchResults([])
      setTemplateResults([])
      setIsPopoverOpen(false)
      return
    }

    const lowerCaseQuery = inputValue.toLowerCase()
    const filtered = categories.filter((cat) => cat.name.toLowerCase().includes(lowerCaseQuery))
    setSearchResults(filtered)

    const existingCategoryNames = new Set(categories.map((c) => c.name.toLowerCase()))
    const filteredTemplates = templateCategories.filter((template) => {
      const templateNameLower = template.name.toLowerCase()
      if (existingCategoryNames.has(templateNameLower)) return false
      return (
        templateNameLower.includes(lowerCaseQuery) ||
        template.description?.toLowerCase().includes(lowerCaseQuery)
      )
    })
    setTemplateResults(filteredTemplates)

    setIsPopoverOpen(
      filtered.length > 0 ||
        filteredTemplates.length > 0 ||
        (inputValue.trim() !== '' && !selectedCategory)
    )
    setHighlightedIndex(-1)
  }, [inputValue, categories, selectedCategory])

  const showCreateOption =
    inputValue.trim() !== '' &&
    !searchResults.some((cat) => cat.name.toLowerCase() === inputValue.toLowerCase()) &&
    !templateResults.some((template) => template.name.toLowerCase() === inputValue.toLowerCase())

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    onSelectCategory: (category: Category) => void,
    onSelectTemplate: (template: (typeof templateCategories)[0]) => void,
    onShowCategoryForm: () => void,
    onSubmit: () => void
  ) => {
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
          if (highlightedIndex < userCategoriesCount) {
            onSelectCategory(searchResults[highlightedIndex])
          } else if (highlightedIndex < userCategoriesCount + templateResults.length) {
            onSelectTemplate(templateResults[highlightedIndex - userCategoriesCount])
          } else {
            onShowCategoryForm()
          }
        } else {
          onSubmit()
        }
      } else if (e.key === 'Escape') {
        setIsPopoverOpen(false)
      }
    } else {
      if (e.key === 'Enter') {
        e.preventDefault()
        onSubmit()
      }
    }
  }

  return {
    searchResults,
    templateResults,
    isPopoverOpen,
    setIsPopoverOpen,
    highlightedIndex,
    setHighlightedIndex,
    showCreateOption,
    handleKeyDown
  }
}
