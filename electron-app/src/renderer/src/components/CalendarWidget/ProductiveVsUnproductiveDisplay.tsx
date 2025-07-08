import { processColor } from '../../lib/colors'
import { notionStyleCategoryColors } from '../Settings/CategoryForm'

interface Props {
  productiveDuration: number
  unproductiveDuration: number
  isDarkMode: boolean
  formatDuration?: (ms: number) => string | null
}

export function ProductiveVsUnproductiveDisplay({
  productiveDuration,
  unproductiveDuration,
  isDarkMode,
  formatDuration
}: Props) {
  const format = formatDuration
    ? formatDuration
    : (ms: number) => `${(ms / (1000 * 60 * 60)).toFixed(1)}h`

  return (
    <div className="flex flex-col items-left gap-0.5 mt-1">
      {productiveDuration > 0 && (
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: processColor(notionStyleCategoryColors[0], {
                isDarkMode,
                opacity: isDarkMode ? 0.7 : 0.6
              })
            }}
          />
          <span>
            {format(productiveDuration)}{' '}
            <span className="text-muted-foreground hidden md:inline">
              (
              {Math.round((productiveDuration / (productiveDuration + unproductiveDuration)) * 100)}
              %)
            </span>
          </span>
        </div>
      )}
      {unproductiveDuration > 0 && (
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: processColor(notionStyleCategoryColors[1], {
                isDarkMode,
                opacity: isDarkMode ? 0.7 : 0.6
              })
            }}
          />
          <span>
            {format(unproductiveDuration)}{' '}
            <span className="text-muted-foreground hidden md:inline">
              (
              {Math.round(
                (unproductiveDuration / (productiveDuration + unproductiveDuration)) * 100
              )}
              %)
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
