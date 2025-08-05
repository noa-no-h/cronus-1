import { useCallback, useEffect, useState } from 'react'
import { ActiveWindowDetails, Category } from 'shared'
import { uploadActiveWindowEvent } from '../lib/activityUploader'
import { showActivityMovedToast } from '../lib/custom-toasts'
import { trpc } from '../utils/trpc'
import { toast } from './use-toast'

export interface ActivityToRecategorize {
  identifier: string
  nameToDisplay: string
  itemType: 'app' | 'website'
  currentCategoryId: string
  currentCategoryName: string
  currentCategoryColor: string
  categoryReasoning?: string
  originalUrl?: string
  startDateMs?: number
  endDateMs?: number
}

interface UseActivityTrackingProps {
  isAuthenticated: boolean
  token: string | null
  isTrackingPaused: boolean
  setIsSettingsOpen: (open: boolean) => void
  setFocusOn: (focusOn: string | null) => void
}

interface UseActivityTrackingReturn {
  activeWindow: ActiveWindowDetails | null
  isRecategorizeDialogOpen: boolean
  setIsRecategorizeDialogOpen: (open: boolean) => void
  recategorizeTarget: ActivityToRecategorize | null
  setRecategorizeTarget: (target: ActivityToRecategorize | null) => void
  allCategories: Category[] | undefined
  isLoadingAllCategories: boolean
  openRecategorizeDialog: (target: ActivityToRecategorize) => void
  handleSaveRecategorize: (newCategoryId: string) => void
  updateActivityCategoryMutation: any
}

export function useActivityTracking({
  isAuthenticated,
  token,
  isTrackingPaused,
  setIsSettingsOpen,
  setFocusOn
}: UseActivityTrackingProps): UseActivityTrackingReturn {
  const [activeWindow, setActiveWindow] = useState<ActiveWindowDetails | null>(null)
  const [isRecategorizeDialogOpen, setIsRecategorizeDialogOpen] = useState(false)
  const [recategorizeTarget, setRecategorizeTarget] = useState<ActivityToRecategorize | null>(null)

  const trpcUtils = trpc.useContext()

  const { data: allCategoriesData, isLoading: isLoadingAllCategories } =
    trpc.category.getCategories.useQuery({ token: token || '' }, { enabled: !!token })
  const allCategories: Category[] | undefined = allCategoriesData as Category[] | undefined

  const updateActivityCategoryMutation =
    trpc.activeWindowEvents.updateEventsCategoryInDateRange.useMutation({
      onSuccess: (data, variables) => {
        console.log('🔄 RE-CATEGORIZATION SUCCESS:', variables)
        if (data.latestEvent) {
          // Invalidate and refetch the latest event query to update the UI
          trpcUtils.activeWindowEvents.getLatestEvent.setData(
            { token: token || '' },
            data.latestEvent
          )
        }

        const targetCategory = allCategories?.find((cat) => cat._id === variables.newCategoryId)
        const targetCategoryName = targetCategory ? targetCategory.name : 'Unknown Category'

        showActivityMovedToast({
          activityIdentifier: variables.activityIdentifier,
          targetCategoryName,
          timeRangeDescription: 'for the selected period',
          setIsSettingsOpen,
          setFocusOn
        })

        trpcUtils.activeWindowEvents.getEventsForDateRange.invalidate()
        trpcUtils.activeWindowEvents.getLatestEvent.invalidate()

        trpcUtils.category.getCategoryById.invalidate({
          categoryId: variables.newCategoryId
        })

        trpcUtils.category.invalidate()

        setIsRecategorizeDialogOpen(false)
        setRecategorizeTarget(null)
      },
      onError: (error) => {
        console.error('Error updating category:', error)
        // Check for timeout or network/server error
        const isTimeout = error?.message?.toLowerCase().includes('timeout')
        const isNetwork = error?.message?.toLowerCase().includes('network')
        const isServer = error?.message?.toLowerCase().includes('server')
        if (isTimeout || isNetwork || isServer) {
          toast({
            duration: 1000,
            title: 'Server Unresponsive',
            description:
              'Hey, sorry the server is unresponsive right now, please try again in a few minutes.',
            variant: 'destructive'
          })
        } else {
          toast({
            duration: 1000,
            title: 'Error',
            description: 'Failed to re-categorize activity. ' + error.message,
            variant: 'destructive'
          })
        }
      }
    })

  const openRecategorizeDialog = useCallback(
    (target: ActivityToRecategorize) => {
      console.log('Opening re-categorize dialog for:', target)
      setRecategorizeTarget(target)
      setIsRecategorizeDialogOpen(true)
    },
    [setRecategorizeTarget, setIsRecategorizeDialogOpen]
  )

  const handleSaveRecategorize = useCallback(
    (newCategoryId: string): void => {
      if (!recategorizeTarget || !token) {
        toast({
          title: 'Error',
          description: 'Missing data for re-categorization.',
          variant: 'destructive'
        })
        return
      }

      let { startDateMs, endDateMs } = recategorizeTarget
      if (startDateMs === undefined || endDateMs === undefined) {
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const endOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
          0,
          0,
          0,
          0
        )
        startDateMs = startOfToday.getTime()
        endDateMs = endOfToday.getTime()
      }

      updateActivityCategoryMutation.mutate({
        token,
        startDateMs: startDateMs,
        endDateMs: endDateMs,
        activityIdentifier: recategorizeTarget.identifier,
        itemType: recategorizeTarget.itemType,
        newCategoryId: newCategoryId
      })
    },
    [recategorizeTarget, token, updateActivityCategoryMutation]
  )

  // Handle IPC recategorization requests
  useEffect(() => {
    const handleRecategorizeRequestFromIPC = (receivedData: ActivityToRecategorize): void => {
      console.log('App.tsx: IPC Handler - Raw received data:', receivedData)
      if (receivedData && typeof receivedData === 'object' && receivedData.identifier) {
        openRecategorizeDialog(receivedData)
      } else {
        console.warn('App.tsx: IPC recategorize request failed. Data received:', receivedData)
      }
    }

    if (window.api && window.api.onDisplayRecategorizePage) {
      const cleanup = window.api.onDisplayRecategorizePage(handleRecategorizeRequestFromIPC)
      return cleanup
    } else {
      console.warn('App.tsx: window.api.onDisplayRecategorizePage not available for IPC.')
      return () => {}
    }
  }, [token, openRecategorizeDialog, activeWindow])

  const eventCreationMutation = trpc.activeWindowEvents.create.useMutation({
    onSuccess: () => {
      trpcUtils.activeWindowEvents.getEventsForDateRange.invalidate()
      // invalidating this because we modify the active window event in the backend
      trpcUtils.activeWindowEvents.getLatestEvent.invalidate()
    },
    onError: (error) => {
      console.error('Error creating active window event:', error)
    }
  })

  // Handle active window changes and upload events
  useEffect(() => {
    const cleanup = window.api.onActiveWindowChanged((details) => {
      setActiveWindow(details)
      if (details && isAuthenticated && token && !isTrackingPaused) {
        uploadActiveWindowEvent(
          token,
          details as ActiveWindowDetails & { localScreenshotPath?: string | undefined },
          eventCreationMutation.mutateAsync
        )
      }
    })
    return cleanup
  }, [isAuthenticated, token, eventCreationMutation.mutateAsync, isTrackingPaused])

  return {
    activeWindow,
    isRecategorizeDialogOpen,
    setIsRecategorizeDialogOpen,
    recategorizeTarget,
    setRecategorizeTarget,
    allCategories,
    isLoadingAllCategories,
    openRecategorizeDialog,
    handleSaveRecategorize,
    updateActivityCategoryMutation
  }
}
