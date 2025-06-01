import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
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
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`bg-card border-border${!isEditing ? ' cursor-pointer' : ''}`}
      onClick={() => {
        if (!isEditing) setIsEditing(true)
      }}
      tabIndex={0}
      role="button"
      aria-label={!isEditing ? 'Click to edit your goals' : undefined}
    >
      <CardHeader>
        <CardTitle className="text-card-foreground">Your Goals</CardTitle>
        <CardDescription>Adding your goals helps our AI categorize your activity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Life Goal */}
        <div>
          <label htmlFor="lifeGoal" className="block text-sm font-medium text-foreground mb-1">
            Life Goal (5 Year Vision)
          </label>
          {isEditing ? (
            <textarea
              id="lifeGoal"
              value={goals.lifeGoal}
              onChange={(e) => handleInputChange('lifeGoal', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-input text-foreground placeholder-muted-foreground"
              rows={2}
              placeholder="What do you want to achieve in the next 5 years?"
            />
          ) : (
            <p className="px-3 py-2 bg-input rounded-md text-foreground min-h-[2.5rem]">
              {goals.lifeGoal || (
                <span className="text-muted-foreground italic">No life goal set</span>
              )}
            </p>
          )}
        </div>

        {/* Weekly Goal */}
        <div>
          <label htmlFor="weeklyGoal" className="block text-sm font-medium text-foreground mb-1">
            Goal for This Week
          </label>
          {isEditing ? (
            <textarea
              id="weeklyGoal"
              value={goals.weeklyGoal}
              onChange={(e) => handleInputChange('weeklyGoal', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-input text-foreground placeholder-muted-foreground"
              rows={2}
              placeholder="What do you want to accomplish this week?"
            />
          ) : (
            <p className="px-3 py-2 bg-input rounded-md text-foreground min-h-[2.5rem]">
              {goals.weeklyGoal || (
                <span className="text-muted-foreground italic">No weekly goal set</span>
              )}
            </p>
          )}
        </div>

        {/* Daily Goal */}
        <div>
          <label htmlFor="dailyGoal" className="block text-sm font-medium text-foreground mb-1">
            Goal for Today
          </label>
          {isEditing ? (
            <textarea
              id="dailyGoal"
              value={goals.dailyGoal}
              onChange={(e) => handleInputChange('dailyGoal', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-input text-foreground placeholder-muted-foreground"
              rows={2}
              placeholder="What's your main focus for today?"
            />
          ) : (
            <p className="px-3 py-2 bg-input rounded-md text-foreground min-h-[2.5rem]">
              {goals.dailyGoal || (
                <span className="text-muted-foreground italic">No daily goal set</span>
              )}
            </p>
          )}
        </div>

        {isEditing && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted border border-border rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Goals'}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default GoalInputForm
