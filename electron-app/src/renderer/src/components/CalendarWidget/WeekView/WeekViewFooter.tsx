import { processColor } from '../../../lib/colors'
import { notionStyleCategoryColors } from '../../Settings/CategoryForm'

interface WeekViewFooterProps {
  totalDayDuration: number
  totalProductiveDuration: number
  totalUnproductiveDuration: number
  isDarkMode: boolean
  formatDuration: (ms: number) => string | null
}

export const WeekViewFooter = ({
  totalDayDuration,
  totalProductiveDuration,
  totalUnproductiveDuration,
  isDarkMode,
  formatDuration
}: WeekViewFooterProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-muted-foreground text-xs font-normal p-1 border-t h-16 dark:border-slate-700">
      {totalDayDuration > 0 ? (
        <>
          <div className="text-foreground font-medium">{formatDuration(totalDayDuration)}</div>
          <div className="flex flex-col items-left gap-0.5 mt-1">
            {totalProductiveDuration > 0 && (
              <div className="flex items-left gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: processColor(notionStyleCategoryColors[0], {
                      isDarkMode,
                      opacity: isDarkMode ? 0.7 : 0.6
                    })
                  }}
                />
                <span>{formatDuration(totalProductiveDuration)}</span>
              </div>
            )}
            {totalUnproductiveDuration > 0 && (
              <div className="flex items-left gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: processColor(notionStyleCategoryColors[1], {
                      isDarkMode,
                      opacity: isDarkMode ? 0.7 : 0.6
                    })
                  }}
                />
                <span>{formatDuration(totalUnproductiveDuration)}</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div>No data</div>
      )}
    </div>
  )
}
