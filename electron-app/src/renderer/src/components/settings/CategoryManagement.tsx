import { Check, Edit3, PlusCircle, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ComparableCategory, defaultComparableCategories } from 'shared/categories'
import { Category } from '../../../../../../shared/types' // Adjusted path
import { useAuth } from '../../contexts/AuthContext' // Added useAuth import
import { trpc } from '../../utils/trpc'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card' // Added Card components
import { Input } from '../ui/input' // Added shadcn/ui Input
import { Label } from '../ui/label' // Added shadcn/ui Label
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover' // Added Popover imports
import { Switch } from '../ui/switch' // Added shadcn/ui Switch
import { Textarea } from '../ui/textarea'

function checkCategoriesAgainstDefaults(
  currentCategories: Category[] | undefined,
  defaults: ComparableCategory[]
): boolean {
  if (!currentCategories) {
    // If currentCategories is undefined (e.g. loading), or null
    // they are not considered matching the defaults.
    return false
  }

  // Normalize current categories for comparison
  const normalizedCurrentCategories: ComparableCategory[] = currentCategories.map((cat) => ({
    name: cat.name,
    description: cat.description || '', // Treat undefined/null description as empty string
    color: cat.color.toUpperCase(),
    isProductive: cat.isProductive
  }))

  const normalizedDefaults: ComparableCategory[] = defaults.map((def) => ({
    ...def,
    description: def.description || '', // Treat undefined/null description as empty string
    color: def.color.toUpperCase()
  }))

  if (normalizedCurrentCategories.length !== normalizedDefaults.length) {
    return false // Different number of categories
  }

  for (const defaultCat of normalizedDefaults) {
    const currentCatMatch = normalizedCurrentCategories.find((cc) => cc.name === defaultCat.name)

    if (!currentCatMatch) {
      return false // A default category name is missing from current
    }

    // Compare properties
    if (
      currentCatMatch.description !== defaultCat.description ||
      currentCatMatch.isProductive !== defaultCat.isProductive
    ) {
      return false // Properties don't match
    }
  }

  return true // All defaults found and match current categories
}

// Basic Form for Create/Edit
interface CategoryFormProps {
  initialData?: Category
  onSave: (data: Omit<Category, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  isSaving: boolean
}

function CategoryForm({ initialData, onSave, onCancel, isSaving }: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [color, setColor] = useState(initialData?.color || '#3B82F6') // Default to a pleasant blue
  const [isProductive, setIsProductive] = useState(
    initialData?.isProductive === undefined ? true : initialData.isProductive
  )
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      setError('Color must be a valid hex code (e.g., #RRGGBB).')
      return
    }
    setError('')
    onSave({ name, description, color, isProductive })
  }

  const notionColors = [
    '#3B82F6', // Blue (selected in example)
    '#A855F7', // Purple
    '#EC4899', // Pink
    '#F97316', // Orange
    '#CA8A04', // Gold
    '#10B981', // Green (Emerald 500)
    '#06B6D4', // Cyan
    '#6B7280', // Gray 500
    '#8B5CF6', // Violet 500
    '#D946EF', // Fuchsia 500
    '#F59E0B', // Amber 500
    '#22C55E' // Lime 500
  ]

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-card rounded-lg shadow-md space-y-6">
      <div>
        <Label htmlFor="categoryName" className="block text-sm font-medium text-foreground mb-1">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="categoryName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:ring-primary focus:border-primary"
          required
        />
      </div>
      <div>
        <Label
          htmlFor="categoryDescription"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Description
        </Label>
        <Textarea
          rows={2}
          id="categoryDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:ring-primary focus:border-primary resize-none"
        />
      </div>
      <div className="flex items-start space-x-4">
        <div className="flex-1 space-y-4">
          <div>
            <Label className="block text-sm font-medium text-foreground mb-1">Type</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="isProductive"
                checked={isProductive}
                onCheckedChange={setIsProductive}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
              <Label htmlFor="isProductive" className="text-foreground text-sm font-medium">
                {isProductive ? 'Productive' : 'Unproductive'}
              </Label>
            </div>
          </div>
        </div>

        <div className="w-auto">
          {' '}
          <Label className="block text-sm font-medium text-foreground mb-2">
            Color <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-10 h-10 p-0 border-border hover:border-ring flex-shrink-0"
                  style={{ backgroundColor: color, transition: 'background-color 0.2s' }}
                  aria-label="Pick a color"
                  title={color}
                ></Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border">
                <div className="grid grid-cols-6 gap-2 p-3 rounded-md">
                  {notionColors.map((bgColor) => (
                    <button
                      type="button"
                      key={bgColor}
                      className={`w-8 h-8 rounded-full flex items-center justify-center focus:outline-none ring-1 ring-border hover:ring-2 hover:ring-ring transition-all`}
                      style={{ backgroundColor: bgColor }}
                      onClick={() => {
                        setColor(bgColor)
                      }}
                      title={bgColor}
                    >
                      {color === bgColor && <Check size={18} className="text-white" />}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value.toUpperCase())}
              placeholder="#RRGGBB"
              maxLength={7}
              className="w-28 px-3 py-2 bg-input border border-border rounded-md text-foreground focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-destructive-foreground">{error}</p>}
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} className="flex items-center">
          {isSaving ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Category'
          )}
        </Button>
      </div>
    </form>
  )
}

export function CategoryManagement() {
  const { token } = useAuth()
  const utils = trpc.useUtils()
  const {
    data: categories,
    isLoading,
    error: fetchError
  } = trpc.category.getCategories.useQuery({ token: token || '' }, { enabled: !!token }) as {
    data: Category[] | undefined
    isLoading: boolean
    error: any
  }
  const createMutation = trpc.category.createCategory.useMutation({
    onSuccess: () => {
      utils.category.getCategories.invalidate({ token: token || '' })
      setIsFormOpen(false)
      setEditingCategory(null)
    },
    onError: (err) => {
      alert(`Error creating category: ${err.message}`)
    }
  })
  const updateMutation = trpc.category.updateCategory.useMutation({
    onSuccess: () => {
      utils.category.getCategories.invalidate({ token: token || '' })
      setIsFormOpen(false)
      setEditingCategory(null)
    },
    onError: (err) => {
      alert(`Error updating category: ${err.message}`)
    }
  })
  const deleteMutation = trpc.category.deleteCategory.useMutation({
    onSuccess: (_data) => {
      utils.category.getCategories.invalidate({ token: token || '' })
    },
    onError: (err) => {
      alert(`Error deleting category: ${err.message}`)
    }
  })

  const resetToDefaultMutation = trpc.category.resetToDefault.useMutation({
    onSuccess: () => {
      utils.category.getCategories.invalidate({ token: token || '' })
      setIsFormOpen(false) // Close form if open
      setEditingCategory(null) // Clear editing state
      alert('Categories have been reset to default.')
    },
    onError: (err) => {
      alert(`Error resetting categories: ${err.message}`)
    }
  })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [areCategoriesMatchingDefaults, setAreCategoriesMatchingDefaults] = useState(false)

  useEffect(() => {
    // Update whether categories match defaults whenever 'categories' data changes
    // or when loading state finishes.
    if (!isLoading) {
      const result = checkCategoriesAgainstDefaults(categories, defaultComparableCategories)
      setAreCategoriesMatchingDefaults(result)
    }
  }, [categories, isLoading])

  const handleAddNew = () => {
    setEditingCategory(null)
    setIsFormOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!token) {
      alert('Authentication token not found. Please log in again.')
      return
    }
    if (window.confirm('Are you sure you want to delete this category?')) {
      await deleteMutation.mutateAsync({ id, token })
    }
  }

  const handleResetToDefault = async () => {
    if (!token) {
      alert('Authentication token not found. Please log in again.')
      return
    }
    if (
      window.confirm(
        'Are you sure you want to reset all categories to their default settings? This action cannot be undone.'
      )
    ) {
      await resetToDefaultMutation.mutateAsync({ token })
    }
  }

  const handleSaveCategory = async (
    data: Omit<Category, '_id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!token) {
      alert('Authentication token not found. Please log in again.')
      return
    }
    if (editingCategory) {
      await updateMutation.mutateAsync({ id: editingCategory._id, ...data, token })
    } else {
      await createMutation.mutateAsync({ ...data, token })
    }
  }

  const handleToggleProductive = async (category: Category) => {
    if (!token) {
      alert('Authentication token not found. Please log in again.')
      return
    }
    await updateMutation.mutateAsync({
      id: category._id,
      isProductive: !category.isProductive,
      token
    })
  }

  if (!token && !isLoading) {
    return (
      <div className="p-4 text-center text-yellow-500 bg-yellow-100 border border-yellow-500 rounded-md">
        Please log in to manage categories.
      </div>
    )
  }

  if (isLoading)
    return <div className="text-center p-4 text-muted-foreground">Loading categories...</div>
  if (fetchError)
    return (
      <div className="text-center p-4 text-destructive-foreground">
        Error loading categories: {fetchError.message}
      </div>
    )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Manage Categories</CardTitle>
            <CardDescription>
              Organize your activities by creating and managing categories.
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {!areCategoriesMatchingDefaults &&
              categories && ( // Show only if not matching defaults and categories are loaded
                <Button
                  onClick={handleResetToDefault}
                  variant="outline"
                  className="text-sm font-medium"
                  disabled={
                    !token ||
                    isFormOpen ||
                    resetToDefaultMutation.isLoading ||
                    createMutation.isLoading ||
                    updateMutation.isLoading ||
                    deleteMutation.isLoading
                  }
                >
                  Reset to Default
                </Button>
              )}
            <Button
              onClick={handleAddNew}
              className="flex items-center text-sm font-medium"
              disabled={!token || isFormOpen} // Disable if form is open
            >
              <PlusCircle size={18} className="mr-2" />
              Add New Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isFormOpen && (
            <CategoryForm
              initialData={editingCategory || undefined}
              onSave={handleSaveCategory}
              onCancel={() => {
                setIsFormOpen(false)
                setEditingCategory(null)
              }}
              isSaving={createMutation.isLoading || updateMutation.isLoading}
            />
          )}

          {!isFormOpen && (!categories || categories.length === 0) && (
            <div className="text-center py-8 px-4 bg-muted/50 rounded-lg border border-dashed border-border">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-foreground">No categories yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating a new category.
              </p>
              <div className="mt-6">
                <Button
                  onClick={handleAddNew}
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary"
                  disabled={!token}
                >
                  <PlusCircle size={20} className="-ml-1 mr-2 h-5 w-5" />
                  New Category
                </Button>
              </div>
            </div>
          )}

          {!isFormOpen && categories && categories.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <ul role="list" className="divide-y divide-border">
                {categories.map((category) => (
                  <li
                    key={category._id}
                    className="px-4 py-4 sm:px-6 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span
                          style={{ backgroundColor: category.color }}
                          className="w-4 h-4 rounded-full mr-3 flex-shrink-0 border border-border"
                        ></span>
                        <div>
                          <p className="text-md font-medium text-foreground truncate">
                            {category.name}
                          </p>
                          {category.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex items-center space-x-2 sm:space-x-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleProductive(category)}
                          title={
                            category.isProductive ? 'Mark as Unproductive' : 'Mark as Productive'
                          }
                          className={`p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background ${
                            category.isProductive
                              ? 'text-green-500 hover:bg-green-500/20 focus:ring-green-500'
                              : 'text-red-500 hover:bg-red-500/20 focus:ring-red-500'
                          }`}
                          disabled={!token}
                        >
                          {category.isProductive ? (
                            <ToggleRight size={22} />
                          ) : (
                            <ToggleLeft size={22} />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                          className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background focus:ring-primary"
                          title="Edit category"
                          disabled={!token}
                        >
                          <Edit3 size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category._id)}
                          disabled={
                            !token ||
                            (deleteMutation.isLoading &&
                              deleteMutation.variables?.id === category._id)
                          }
                          className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background focus:ring-destructive disabled:opacity-50"
                          title="Delete category"
                        >
                          {deleteMutation.isLoading &&
                          deleteMutation.variables?.id === category._id ? (
                            <svg
                              className="animate-spin h-4 w-4 text-muted-foreground"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
