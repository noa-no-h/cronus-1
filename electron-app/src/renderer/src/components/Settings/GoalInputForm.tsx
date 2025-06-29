import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { trpc } from '../../utils/trpc'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { toast } from '../../hooks/use-toast'

interface GoalInputFormProps {
  onboardingMode?: boolean
  onComplete?: () => void
}

const GoalInputForm = ({ onboardingMode = false, onComplete }: GoalInputFormProps) => {
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

      if (!onboardingMode) {
        toast({
          title: 'Goals Updated!',
          description: 'Your goals have been successfully updated.'
        })
      }

      // Call onComplete if in onboarding mode
      if (onboardingMode && onComplete) {
        onComplete()
      }
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
    if (userGoals) {
      setGoals(userGoals)
    }
  }, [userGoals])

  // Auto-edit mode for onboarding
  useEffect(() => {
    if (onboardingMode) {
      setIsEditing(true)
    }
  }, [onboardingMode])

  const handleSave = async () => {
    if (!token) return

    setIsSaving(true)
    updateGoalsMutation.mutate({
      token,
      ...goals
    })
  }

  const handleCancel = () => {
    if (onboardingMode) {
      // Skip goals in onboarding
      if (onComplete) {
        onComplete()
      }
    } else {
      // Reset to original values
      if (userGoals) {
        setGoals(userGoals)
      }
      setIsEditing(false)
    }
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
      className={`bg-card border-border ${
        onboardingMode ? '' : !isEditing ? 'cursor-pointer' : ''
      }`}
      onClick={
        onboardingMode
          ? undefined
          : () => {
              if (!isEditing) setIsEditing(true)
            }
      }
      tabIndex={onboardingMode ? undefined : 0}
      role={onboardingMode ? undefined : 'button'}
      aria-label={!onboardingMode && !isEditing ? 'Click to edit your goals' : undefined}
    >
      <CardHeader>
        <CardTitle className="text-card-foreground">
          {onboardingMode ? 'What are your goals?' : 'Your Goals'}
        </CardTitle>
        <CardDescription>
          {onboardingMode
            ? 'Help us understand what productivity means to you.'
            : 'Adding your goals helps our AI categorize your activity.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="lifeGoal" className="block text-sm font-medium text-foreground mb-1">
            Life Goal (5 Year Vision)
          </label>
          {isEditing ? (
            <Textarea
              id="lifeGoal"
              value={goals.lifeGoal}
              onChange={(e) => handleInputChange('lifeGoal', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-input text-foreground placeholder-muted-foreground"
              rows={2}
              placeholder="What do you want to achieve in the next 5 years?"
            />
          ) : (
            <p className="px-3 py-2 bg-input/50 rounded-md text-foreground min-h-[2.5rem]">
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
            <Textarea
              id="weeklyGoal"
              value={goals.weeklyGoal}
              onChange={(e) => handleInputChange('weeklyGoal', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-input text-foreground placeholder-muted-foreground"
              rows={2}
              placeholder="What do you want to accomplish this week?"
            />
          ) : (
            <p className="px-3 py-2 bg-input/50 rounded-md text-foreground min-h-[2.5rem]">
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
            <Textarea
              id="dailyGoal"
              value={goals.dailyGoal}
              onChange={(e) => handleInputChange('dailyGoal', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-input text-foreground placeholder-muted-foreground"
              rows={2}
              placeholder="What's your main focus for today?"
            />
          ) : (
            <p className="px-3 py-2 bg-input/50 rounded-md text-foreground min-h-[2.5rem]">
              {goals.dailyGoal || (
                <span className="text-muted-foreground italic">No daily goal set</span>
              )}
            </p>
          )}
        </div>

        {isEditing && (
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
              {onboardingMode ? 'Skip for Now' : 'Cancel'}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : onboardingMode ? 'Save & Continue' : 'Save Goals'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default GoalInputForm
