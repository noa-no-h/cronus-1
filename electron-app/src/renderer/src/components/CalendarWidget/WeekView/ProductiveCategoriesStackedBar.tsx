import { getDarkerColor, processColor } from '../../../lib/colors'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip'
import type { CategoryTotal } from './WeekView'

interface ProductiveCategoriesStackedBarProps {
  productiveCategories: CategoryTotal[]
  totalProductiveDuration: number
  productivePercentage: number
  isDarkMode: boolean
}

const formatDuration = (ms: number): string | null => {
  if (ms < 1000) return null
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m`
  }
  return null
}

const ProductiveCategoriesStackedBar = ({
  productiveCategories,
  totalProductiveDuration,
  productivePercentage,
  isDarkMode
}: ProductiveCategoriesStackedBarProps) => {
  // Group small categories (< 20 min) into one 'Other' at the bottom
  const twentyMinMs = 20 * 60 * 1000
  const large = productiveCategories.filter((cat) => cat.totalDurationMs >= twentyMinMs)
  const small = productiveCategories.filter((cat) => cat.totalDurationMs < twentyMinMs)
  let grouped = [...large]
  let otherCategories: Array<{ name: string; duration: number }> = []
  if (small.length > 0) {
    const otherDuration = small.reduce((sum, cat) => sum + cat.totalDurationMs, 0)
    otherCategories = small.map((cat) => ({ name: cat.name, duration: cat.totalDurationMs }))
    grouped.push({
      categoryId: 'other',
      name: 'Other',
      categoryColor: '#808080',
      totalDurationMs: otherDuration,
      isProductive: true,
      _otherCategories: otherCategories
    })
  }
  // Sort by duration descending, but always put 'Other' last if present
  grouped = grouped
    .filter((cat) => cat.categoryId !== 'other')
    .sort((a, b) => b.totalDurationMs - a.totalDurationMs)
  if (otherCategories.length > 0) {
    grouped.push({
      categoryId: 'other',
      name: 'Other',
      categoryColor: '#808080',
      totalDurationMs: otherCategories.reduce((sum, c) => sum + c.duration, 0),
      isProductive: true,
      _otherCategories: otherCategories
    })
  }
  return (
    <div className="w-full flex flex-col gap-px" style={{ height: `${productivePercentage}%` }}>
      {grouped.map((cat, catIndex) => {
        const percentage = (cat.totalDurationMs / totalProductiveDuration) * 100
        const showLabel = cat.totalDurationMs >= 30 * 60 * 1000 // 30 min
        const isOther = cat.categoryId === 'other'
        return (
          <Tooltip key={catIndex} delayDuration={100}>
            <TooltipTrigger asChild>
              <div
                className="w-full transition-all duration-300 rounded-lg flex items-center justify-center text-center overflow-hidden"
                style={{
                  height: `${percentage}%`,
                  backgroundColor: processColor(
                    isOther ? '#808080' : cat.categoryColor || '#808080',
                    {
                      isDarkMode,
                      saturation: 1.2,
                      lightness: 1.1,
                      opacity: isDarkMode ? 0.7 : 0.5
                    }
                  )
                }}
              >
                {percentage > 10 && showLabel && (
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: getDarkerColor(
                        isOther ? '#808080' : cat.categoryColor || '#808080',
                        isDarkMode ? 0.8 : 0.5
                      )
                    }}
                  >
                    {formatDuration(cat.totalDurationMs)}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              {isOther && cat._otherCategories
                ? [
                    <div key="other-title">
                      <b>Other:</b>
                    </div>,
                    ...cat._otherCategories.map((c, i) => (
                      <div key={i}>
                        {c.name}: {formatDuration(c.duration) || ''}
                      </div>
                    ))
                  ]
                : cat.name}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export default ProductiveCategoriesStackedBar
