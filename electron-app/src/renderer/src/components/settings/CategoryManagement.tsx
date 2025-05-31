import { Edit3, PlusCircle, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Category } from '../../../../../../shared/types' // Adjusted path
import { useAuth } from '../../contexts/AuthContext' // Added useAuth import
import { trpc } from '../../utils/trpc'

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
  const [color, setColor] = useState(initialData?.color || '#FFFFFF') // Default color
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

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-800 rounded-lg shadow-md space-y-4">
      <div>
        <label htmlFor="categoryName" className="block text-sm font-medium text-gray-300 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="categoryName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label
          htmlFor="categoryDescription"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="categoryDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <label htmlFor="categoryColor" className="block text-sm font-medium text-gray-300 mb-1">
            Color <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <input
              id="categoryColor"
              type="color" // Use type="color" for a native color picker
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="p-1 h-10 w-14 block bg-gray-700 border border-gray-600 cursor-pointer rounded-md" // Basic styling for color input
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value.toUpperCase())}
              placeholder="#RRGGBB"
              maxLength={7}
              className="ml-2 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
          <button
            type="button"
            onClick={() => setIsProductive(!isProductive)}
            className={`p-2 rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
              isProductive
                ? 'bg-green-500 hover:bg-green-600 focus:ring-green-400'
                : 'bg-red-500 hover:bg-red-600 focus:ring-red-400'
            }`}
          >
            {isProductive ? (
              <ToggleRight size={24} className="text-white" />
            ) : (
              <ToggleLeft size={24} className="text-white" />
            )}
            <span className="ml-2 text-white text-sm font-medium">
              {isProductive ? 'Productive' : 'Unproductive'}
            </span>
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center"
        >
          {isSaving ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
        </button>
      </div>
    </form>
  )
}

export function CategoryManagement() {
  const { token } = useAuth() // Get token
  const utils = trpc.useUtils()
  const {
    data: categories,
    isLoading,
    error: fetchError
  } = trpc.category.getCategories.useQuery({ token: token || '' }, { enabled: !!token }) as {
    data: Category[] | undefined
    isLoading: boolean
    error: any
  } // Explicitly type the destructured data
  const createMutation = trpc.category.createCategory.useMutation({
    onSuccess: () => {
      utils.category.getCategories.invalidate({ token: token || '' }) // Invalidate with token
      setIsFormOpen(false)
      setEditingCategory(null)
    },
    onError: (err) => {
      alert(`Error creating category: ${err.message}`)
    }
  })
  const updateMutation = trpc.category.updateCategory.useMutation({
    onSuccess: () => {
      utils.category.getCategories.invalidate({ token: token || '' }) // Invalidate with token
      setIsFormOpen(false)
      setEditingCategory(null)
    },
    onError: (err) => {
      alert(`Error updating category: ${err.message}`)
    }
  })
  const deleteMutation = trpc.category.deleteCategory.useMutation({
    onSuccess: (data) => {
      utils.category.getCategories.invalidate({ token: token || '' }) // Invalidate with token
    },
    onError: (err) => {
      alert(`Error deleting category: ${err.message}`)
    }
  })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const handleAddNew = () => {
    setEditingCategory(null) // Ensure no initial data for new category
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
      await deleteMutation.mutateAsync({ id, token }) // Pass token
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
      await updateMutation.mutateAsync({ id: editingCategory._id, ...data, token }) // Pass token
    } else {
      await createMutation.mutateAsync({ ...data, token }) // Pass token
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
      token // Pass token
    })
  }

  if (!token && !isLoading) {
    // If no token and not initial loading state for categories query
    return (
      <div className="p-4 text-center text-yellow-500 bg-yellow-100 border border-yellow-500 rounded-md">
        Please log in to manage categories.
      </div>
    )
  }

  if (isLoading) return <div className="text-center p-4 text-gray-400">Loading categories...</div>
  if (fetchError)
    return (
      <div className="text-center p-4 text-red-500">
        Error loading categories: {fetchError.message}
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-100">Manage Categories</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
          disabled={!token} // Disable if no token
        >
          <PlusCircle size={18} className="mr-2" />
          Add New Category
        </button>
      </div>

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
        <div className="text-center py-8 px-4 bg-gray-800 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-500"
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
          <h3 className="mt-2 text-sm font-medium text-gray-200">No categories yet</h3>
          <p className="mt-1 text-sm text-gray-400">Get started by creating a new category.</p>
          <div className="mt-6">
            <button
              onClick={handleAddNew}
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
              disabled={!token} // Disable if no token
            >
              <PlusCircle size={20} className="-ml-1 mr-2 h-5 w-5" />
              New Category
            </button>
          </div>
        </div>
      )}

      {!isFormOpen && categories && categories.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
          <ul role="list" className="divide-y divide-gray-700">
            {categories.map((category) => (
              <li
                key={category._id}
                className="px-4 py-4 sm:px-6 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span
                      style={{ backgroundColor: category.color }}
                      className="w-4 h-4 rounded-full mr-3 flex-shrink-0 border border-gray-600"
                    ></span>
                    <div>
                      <p className="text-md font-medium text-gray-100 truncate">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-gray-400 truncate max-w-xs">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex items-center space-x-2 sm:space-x-3">
                    <button
                      onClick={() => handleToggleProductive(category)}
                      title={category.isProductive ? 'Mark as Unproductive' : 'Mark as Productive'}
                      className={`p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-750 ${
                        category.isProductive
                          ? 'text-green-400 hover:bg-green-500/20 focus:ring-green-500'
                          : 'text-red-400 hover:bg-red-500/20 focus:ring-red-500'
                      }`}
                      disabled={!token} // Disable if no token
                    >
                      {category.isProductive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-750 focus:ring-blue-500"
                      title="Edit category"
                      disabled={!token} // Disable if no token
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      disabled={
                        !token ||
                        (deleteMutation.isLoading && deleteMutation.variables?.id === category._id)
                      }
                      className="p-1.5 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-750 focus:ring-red-500 disabled:opacity-50"
                      title="Delete category"
                    >
                      {deleteMutation.isLoading && deleteMutation.variables?.id === category._id ? (
                        <svg
                          className="animate-spin h-4 w-4 text-gray-400"
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
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
