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
}

export function AiCategoryCustomization({ onComplete, goals }: AiCategoryCustomizationProps) {
  const [loading, setLoading] = useState(false)
  const [suggestedCategories, setSuggestedCategories] = useState<any[]>([])
  const { token } = useAuth()
  const generateCategoriesMutation = trpc.category.generateAiCategories.useMutation()
  const isDarkMode = useDarkMode()

  useEffect(() => {
    const fetchCategories = async () => {
      if (token && goals) {
        setLoading(true)
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
        }
      }
    }

    fetchCategories()
  }, [token])

  return (
    <div className="text-center">
      <p className="text-muted-foreground mb-6">
        Select a set of categories to start with. You can always customize them later.
      </p>

      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full h-auto p-4 text-left flex flex-col items-start"
          onClick={() => onComplete([])}
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

        <Button
          variant="outline"
          className="w-full h-auto p-4 text-left flex flex-col items-start"
          onClick={() => onComplete(suggestedCategories)}
          disabled={loading}
        >
          <span className="font-semibold">AI Customized Categories</span>
          {loading ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestedCategories.map((c) => (
                <Badge
                  key={c.name}
                  variant="outline"
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
      </div>
    </div>
  )
}
