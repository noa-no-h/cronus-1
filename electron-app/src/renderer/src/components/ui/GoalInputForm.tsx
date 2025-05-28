import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { trpc } from '../../utils/trpc'

const GoalInputForm = () => {
  const { token } = useAuth()
  const [goals, setGoals] = useState({
    weeklyGoal: '',
    dailyGoal: '',
    lifeGoal: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch user goals
  const { data: userGoals, isLoading } = trpc.user.getUserGoals.useQuery(
    { token: token || '' },
    { enabled: !!token }
  )

  // Update goals mutation
  const updateGoalsMutation = trpc.user.updateUserGoals.useMutation({
    onSuccess: (data) => {
      setGoals(data.userGoals || { weeklyGoal: '', dailyGoal: '', lifeGoal: '' })
      setIsEditing(false)
    },
    onError: (error) => {
      console.error('Failed to update goals:', error)
      alert('Failed to save goals. Please try again.')
    },
    onSettled: () => {
      setIsSaving(false)
    }
  })

  // Load goals when data is fetched
  useEffect(() => {
    setGoals(userGoals || { weeklyGoal: '', dailyGoal: '', lifeGoal: '' })
  }, [userGoals])

  const handleSave = async () => {
    if (!token) return

    setIsSaving(true)
    updateGoalsMutation.mutate({
      token,
      ...goals
    })
  }

  const handleCancel = () => {
    // Reset to original values
    if (userGoals) {
      setGoals(userGoals)
    }
    setIsEditing(false)
  }

  const handleInputChange = (field: keyof typeof goals, value: string) => {
    setGoals((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`p-6 bg-gray-800 rounded-lg shadow-sm${!isEditing ? ' cursor-pointer' : ''}`}
      onClick={() => {
        if (!isEditing) setIsEditing(true)
      }}
      tabIndex={0}
      role="button"
      aria-label={!isEditing ? 'Click to edit your goals' : undefined}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Your Goals</h2>
      </div>

      <div className="space-y-4">
        {/* Life Goal */}
        <div>
          <label htmlFor="lifeGoal" className="block text-sm font-medium text-gray-200 mb-1">
            Life Goal (5 Year Vision)
          </label>
          {isEditing ? (
            <textarea
              id="lifeGoal"
              value={goals.lifeGoal}
              onChange={(e) => handleInputChange('lifeGoal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-700 text-white placeholder-gray-400"
              rows={2}
              placeholder="What do you want to achieve in the next 5 years?"
            />
          ) : (
            <p className="px-3 py-2 bg-gray-700 rounded-md text-white min-h-[2.5rem]">
              {goals.lifeGoal || <span className="text-gray-400 italic">No life goal set</span>}
            </p>
          )}
        </div>

        {/* Weekly Goal */}
        <div>
          <label htmlFor="weeklyGoal" className="block text-sm font-medium text-gray-200 mb-1">
            Goal for This Week
          </label>
          {isEditing ? (
            <textarea
              id="weeklyGoal"
              value={goals.weeklyGoal}
              onChange={(e) => handleInputChange('weeklyGoal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-700 text-white placeholder-gray-400"
              rows={2}
              placeholder="What do you want to accomplish this week?"
            />
          ) : (
            <p className="px-3 py-2 bg-gray-700 rounded-md text-white min-h-[2.5rem]">
              {goals.weeklyGoal || <span className="text-gray-400 italic">No weekly goal set</span>}
            </p>
          )}
        </div>

        {/* Daily Goal */}
        <div>
          <label htmlFor="dailyGoal" className="block text-sm font-medium text-gray-200 mb-1">
            Goal for Today
          </label>
          {isEditing ? (
            <textarea
              id="dailyGoal"
              value={goals.dailyGoal}
              onChange={(e) => handleInputChange('dailyGoal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-700 text-white placeholder-gray-400"
              rows={2}
              placeholder="What's your main focus for today?"
            />
          ) : (
            <p className="px-3 py-2 bg-gray-700 rounded-md text-white min-h-[2.5rem]">
              {goals.dailyGoal || <span className="text-gray-400 italic">No daily goal set</span>}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Goals'}
          </button>
        </div>
      )}
    </div>
  )
}

export default GoalInputForm
