import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  CircleQuestionMark,
  EditIcon,
  ExternalLink,
  Mail,
  MessageCircle,
  Settings as SettingsIcon,
  Youtube
} from 'lucide-react'
import React, { JSX, useEffect, useMemo, useState } from 'react'
import { ActiveWindowDetails, ActiveWindowEvent, Category } from 'shared'
import type { ActivityToRecategorize } from '../App'
import { useAuth } from '../contexts/AuthContext'
import { useDistractionNotification } from '../hooks/useDistractionNotification'
import { useDistractionSound } from '../hooks/useDistractionSound'
import { useRecategorizationHandler } from '../hooks/useRecategorizationHandler'
import {
  getCardBgColor,
  getDisplayWindowInfo,
  getStatusText,
  getStatusTextColor
} from '../utils/distractionStatusBarUIHelpers'
import { calculateProductivityMetrics } from '../utils/timeMetrics'
import { trpc } from '../utils/trpc'
import { ActivityIcon } from './ActivityList/ActivityIcon'
import DistractionStatusLoadingSkeleton from './DistractionStatusLoadingSkeleton'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu'

interface DistractionStatusBarProps {
  activeWindow: ActiveWindowDetails | null
  onOpenMiniTimerClick: () => void
  isMiniTimerVisible: boolean
  onOpenRecategorizeDialog: (target: ActivityToRecategorize) => void
  onSettingsClick: () => void
  isSettingsOpen: boolean
}

// Props comparison can be simplified or removed if activeWindow prop changes don't directly trigger new data fetching logic
// For now, let's keep it, but its role might change.
const arePropsEqual = (
  prevProps: DistractionStatusBarProps,
  nextProps: DistractionStatusBarProps
): boolean => {
  if (!prevProps.activeWindow && !nextProps.activeWindow) return true
  if (!prevProps.activeWindow || !nextProps.activeWindow) return false
  const p = prevProps.activeWindow
  const n = nextProps.activeWindow
  return (
    p.ownerName === n.ownerName &&
    p.title === n.title &&
    p.url === n.url &&
    p.content === n.content && // Assuming content changes are also significant for display
    p.type === n.type &&
    p.browser === n.browser &&
    prevProps.isMiniTimerVisible === nextProps.isMiniTimerVisible &&
    prevProps.onOpenRecategorizeDialog === nextProps.onOpenRecategorizeDialog &&
    prevProps.isSettingsOpen === nextProps.isSettingsOpen
  )
}

const DistractionStatusBar = ({
  activeWindow,
  onOpenMiniTimerClick,
  isMiniTimerVisible,
  onOpenRecategorizeDialog,
  onSettingsClick,
  isSettingsOpen
}: DistractionStatusBarProps): JSX.Element | null => {
  const { token } = useAuth()
  const [isNarrowView, setIsNarrowView] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsNarrowView(window.innerWidth < 800)
    }
    window.addEventListener('resize', handleResize)
    handleResize() // Initial check
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { data: latestEvent, isLoading: isLoadingLatestEvent } =
    // note: make sure you invalidate the query when you create a new event, otherwise it will not be updated
    trpc.activeWindowEvents.getLatestEvent.useQuery(
      { token: token || '' },
      {
        enabled: !!token && typeof token === 'string' && token.length > 0,
        refetchInterval: 1000 // Poll every 1 second
      }
    )

  useEffect(() => {
    if (latestEvent) {
      // @ts-ignore
      window.api?.logToFile(
        '[DistractionCategorizationResult] Received latest event from server:',
        latestEvent
      )
    }
  }, [latestEvent])

  const categoryId = latestEvent?.categoryId

  const {
    data: categoryDetails,
    isLoading: isLoadingCategory,
    error: categoryError
  } = trpc.category.getCategoryById.useQuery(
    { token: token || '', categoryId: categoryId || '' },
    {
      enabled:
        !!token &&
        typeof token === 'string' &&
        token.length > 0 &&
        !!categoryId &&
        categoryId !== ''
    }
  )

  const { data: userCategories, isLoading: isLoadingUserCategories } =
    trpc.category.getCategories.useQuery(
      { token: token || '' },
      { enabled: !!token && typeof token === 'string' && token.length > 0 }
    )

  const [currentDayStartDateMs, setCurrentDayStartDateMs] = React.useState<number | null>(null)
  const [currentDayEndDateMs, setCurrentDayEndDateMs] = React.useState<number | null>(null)

  React.useEffect(() => {
    const updateDates = () => {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
      setCurrentDayStartDateMs(startOfToday.getTime())
      setCurrentDayEndDateMs(endOfToday.getTime())
    }

    updateDates()
    const intervalId = setInterval(updateDates, 10000) // Check every 10 seconds

    return () => clearInterval(intervalId)
  }, [])

  const { data: todayEvents, isLoading: isLoadingTodayEvents } =
    trpc.activeWindowEvents.getEventsForDateRange.useQuery(
      {
        token: token || '',
        startDateMs: currentDayStartDateMs!,
        endDateMs: currentDayEndDateMs!
      },
      {
        enabled:
          !!token &&
          typeof token === 'string' &&
          token.length > 0 &&
          currentDayStartDateMs !== null &&
          currentDayEndDateMs !== null,
        refetchInterval: 30000
      }
    )

  useDistractionSound(categoryDetails as Category | null | undefined)

  const displayWindowInfo = useMemo(
    () => getDisplayWindowInfo(latestEvent, activeWindow),
    [latestEvent, activeWindow]
  )

  useEffect(() => {
    if (!latestEvent || !userCategories || !todayEvents || !window.electron?.ipcRenderer) {
      return
    }

    let latestStatus: 'productive' | 'unproductive' | 'maybe' = 'maybe'
    let categoryDetailsForFloatingWindow: Category | undefined = undefined

    if (categoryDetails && typeof categoryDetails === 'object' && '_id' in categoryDetails) {
      const fullCategoryDetails = categoryDetails as Category
      if (fullCategoryDetails.isProductive === true) latestStatus = 'productive'
      else if (fullCategoryDetails.isProductive === false) {
        latestStatus = 'unproductive'
      }
      categoryDetailsForFloatingWindow = fullCategoryDetails
    } else if (categoryDetails === null) {
      latestStatus = 'maybe'
      // No specific category to send for 'maybe' if it's due to category not found
      // Or we could send a generic "Uncategorized" message if desired
    }

    const { dailyProductiveMs, dailyUnproductiveMs } = calculateProductivityMetrics(
      todayEvents as ActiveWindowEvent[],
      (userCategories?.map((c) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      })) as Category[]) || []
    )

    const itemType = displayWindowInfo.url ? 'website' : 'app'
    const activityIdentifier = displayWindowInfo.isApp
      ? displayWindowInfo.ownerName
      : displayWindowInfo.url
    const activityName = displayWindowInfo.ownerName

    window.electron.ipcRenderer.send('update-floating-window-status', {
      latestStatus,
      dailyProductiveMs,
      dailyUnproductiveMs,
      categoryDetails: categoryDetailsForFloatingWindow,
      itemType,
      activityIdentifier,
      activityName,
      activityUrl: displayWindowInfo.url
    })
  }, [latestEvent, categoryDetails, userCategories, todayEvents, token, displayWindowInfo])

  const statusText = useMemo(
    () =>
      getStatusText(
        latestEvent,
        activeWindow,
        categoryId,
        isLoadingCategory,
        isLoadingUserCategories,
        categoryDetails,
        categoryError
      ),
    [
      latestEvent,
      activeWindow,
      categoryId,
      isLoadingCategory,
      isLoadingUserCategories,
      categoryDetails,
      categoryError
    ]
  )

  useDistractionNotification(
    categoryDetails as Category | null | undefined,
    activeWindow,
    statusText
  )

  const cardBgColor = useMemo(
    () => getCardBgColor(categoryDetails, categoryError),
    [categoryDetails, categoryError]
  )
  const statusTextColor = useMemo(
    () => getStatusTextColor(categoryDetails, categoryError),
    [categoryDetails, categoryError]
  )

  const isLoadingPrimary =
    isLoadingLatestEvent ||
    (token && !latestEvent && !isLoadingCategory && !isLoadingUserCategories)

  const handleOpenRecategorize = useRecategorizationHandler(
    latestEvent,
    displayWindowInfo,
    categoryDetails,
    onOpenRecategorizeDialog
  )

  if (isLoadingPrimary) {
    return <DistractionStatusLoadingSkeleton cardBgColor={cardBgColor} />
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className={clsx(
          'rounded-lg border-none shadow-none p-2 px-4 py-[10px] flex-1 min-w-0 flex flex-row items-center justify-between gap-x-2 sm:gap-x-3',
          cardBgColor
        )}
      >
        <div className="flex-grow min-w-0 flex items-center">
          <AnimatePresence>
            <motion.div
              key={displayWindowInfo.ownerName}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-grow min-w-0 flex items-center"
            >
              {/* Icon Display Logic */}
              <ActivityIcon
                url={displayWindowInfo.isApp ? undefined : displayWindowInfo.url}
                appName={displayWindowInfo.ownerName}
                size={16}
                className="mr-2"
              />
              <span className="text-sm text-foreground truncate">
                {displayWindowInfo.title || displayWindowInfo.ownerName}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div>
          <div
            className={`text-sm select-none font-semibold ${statusTextColor} whitespace-nowrap flex items-center gap-1 cursor-pointer hover:opacity-80`}
            onClick={handleOpenRecategorize}
            title="Re-categorize this activity"
          >
            {statusText}
            {latestEvent && categoryId && !isLoadingCategory && (
              <EditIcon size={14} className="ml-1 flex-shrink-0" />
            )}
          </div>
          {(isLoadingCategory || isLoadingUserCategories || isLoadingTodayEvents) && categoryId && (
            <div className="text-xs text-muted-foreground mt-0.5">Updating...</div>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right flex items-center gap-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
        {!isMiniTimerVisible && (
          <Button variant="ghost" onClick={onOpenMiniTimerClick} title="Open Mini Timer">
            <ExternalLink size={20} />
            {!isNarrowView && <span className="ml-2">{'Open Mini Timer'}</span>}
          </Button>
        )}
        {/* feedback button that triggers dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" title="Open Feedback">
              <CircleQuestionMark size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() =>
                window.open(
                  'mailto:wallawitsch@gmail.com, arne.strickmann@googlemail.com?subject=Cronus%20Feedback'
                )
              }
            >
              <Mail size={20} />
              Email Feedback
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                window.open('https://chat.whatsapp.com/Lrge0tDN19THKld1kCjdwB', '_blank')
              }
            >
              <MessageCircle size={20} />
              WhatsApp Us
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                window.open(
                  'https://www.loom.com/share/34531aee1ce94343a2c4c7cee04a0dc8?sid=a601c97f-9d16-4a7d-97e3-d8fc3db96679',
                  '_blank'
                )
              }
            >
              <Youtube size={20} />
              1.5m Tutorial Video
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size={isNarrowView ? 'icon' : 'default'}
          className={!isNarrowView ? 'w-32' : ''}
          onClick={onSettingsClick}
          title="Settings"
        >
          {isSettingsOpen ? <ArrowLeft size={20} /> : <SettingsIcon size={20} />}
          {!isNarrowView &&
            (isSettingsOpen ? (
              <span className="ml-2">Dashboard</span>
            ) : (
              <span className="ml-2">Settings</span>
            ))}
        </Button>
      </div>
    </div>
  )
}

export default React.memo(DistractionStatusBar, arePropsEqual)
