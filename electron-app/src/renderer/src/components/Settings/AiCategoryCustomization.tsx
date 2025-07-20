import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../hooks/useDarkMode'
import { getDarkerColor, getLighterColor } from '../../lib/colors'
import { trpc } from '../../utils/trpc'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface AiCategoryCustomizationProps {
  onComplete: (categories: any[]) => void
  goals: string
  onLoadingChange?: (loading: boolean) => void
}

export function AiCategoryCustomization({
  onComplete,
  goals,
  onLoadingChange
}: AiCategoryCustomizationProps) {
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [suggestedCategories, setSuggestedCategories] = useState<any[]>([])
  const [selectedOption, setSelectedOption] = useState<'ai' | 'simple'>('ai')
  const { token } = useAuth()
  const generateCategoriesMutation = trpc.category.generateAiCategories.useMutation()
  const isDarkMode = useDarkMode()

  useEffect(() => {
    const fetchCategories = async () => {
      if (token && goals) {
        setLoading(true)
        setCountdown(3)
        onLoadingChange?.(true)

        // Start countdown timer
        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval)
              return 0
            }
            return prev - 1
          })
        }, 1000)

        try {
          const result = await generateCategoriesMutation.mutateAsync({
            token,
            goals
          })
          if (result) {
            setSuggestedCategories(result.categories)
          }
        } catch (error) {
          console.error('Failed to generate categories:', error)
        } finally {
          setLoading(false)
          setCountdown(0)
          onLoadingChange?.(false)
          clearInterval(countdownInterval)
        }
      }
    }

    fetchCategories()
  }, [token])

  const handleComplete = () => {
    if (selectedOption === 'ai') {
      onComplete(suggestedCategories)
    } else {
      onComplete([])
    }
  }

  return (
    <div className="text-center">
      <p className="text-muted-foreground mb-6">
        Select a set of categories to start with. You can always customize them later.
      </p>

      <div className="space-x-4 flex justify-center h-[242px]">
        <Button
          variant="outline"
          className={`w-56 h-full p-4 text-left flex flex-col items-start justify-start transition-all duration-200 ${
            selectedOption === 'ai'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-400'
              : ''
          }`}
          onClick={() => setSelectedOption('ai')}
          disabled={loading}
        >
          <span className="font-semibold">AI Customized Categories</span>
          {loading ? (
            <div className="flex text-sm m-auto justify-center items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ready in {countdown} seconds
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {suggestedCategories.map((c) => (
                <Badge
                  key={c.name}
                  variant="outline"
                  className="w-min"
                  style={{
                    backgroundColor: getLighterColor(c.color, 0.8),
                    color: getDarkerColor(c.color, 0.3),
                    borderColor: getLighterColor(c.color, 0.6)
                  }}
                >
                  {c.name}
                </Badge>
              ))}
            </div>
          )}
        </Button>
        <Button
          variant="outline"
          className={`w-56 h-full p-4 text-left flex flex-col justify-start items-start transition-all duration-200 ${
            selectedOption === 'simple'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-400'
              : ''
          }`}
          onClick={() => setSelectedOption('simple')}
        >
          <span className="font-semibold">Simple Categories</span>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge
              variant="outline"
              style={{
                backgroundColor: getLighterColor('#22C55E', 0.8),
                color: getDarkerColor('#22C55E', 0.3),
                borderColor: getLighterColor('#22C55E', 0.6)
              }}
            >
              Work
            </Badge>
            <Badge
              variant="outline"
              style={{
                backgroundColor: getLighterColor('#EC4899', 0.8),
                color: getDarkerColor('#EC4899', 0.3),
                borderColor: getLighterColor('#EC4899', 0.6)
              }}
            >
              Distraction
            </Badge>
          </div>
        </Button>
      </div>

      <div className="mt-6">
        <Button
          onClick={handleComplete}
          disabled={loading}
          variant="default"
          size="default"
          className="min-w-[140px]"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
