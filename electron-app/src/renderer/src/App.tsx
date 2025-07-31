import React, { useCallback, useEffect, useState } from 'react'
import { ActiveWindowDetails, Category } from 'shared'
import { DashboardView } from './components/DashboardView'
import DistractionStatusBar from './components/DistractionStatusBar'
import { TutorialModal } from './components/Onboarding/TutorialModal'
import { OnboardingModal } from './components/OnboardingModal'
import { QuitConfirmationModal } from './components/QuitConfirmationModal'
import RecategorizeDialog from './components/RecategorizeDialog'
import { PermissionStatus, PermissionType } from './components/Settings/PermissionsStatus'
import { SettingsPage } from './components/SettingsPage'
import { Toaster } from './components/ui/toaster'
import { TooltipProvider } from './components/ui/tooltip'
import { UpdateNotification } from './components/UpdateNotification'
import { useAuth } from './contexts/AuthContext'
import { useSettings } from './contexts/SettingsContext'
import { toast } from './hooks/use-toast'
import { uploadActiveWindowEvent } from './lib/activityUploader'
import { showActivityMovedToast } from './lib/custom-toasts'
import { cn } from './lib/utils'
import { trpc } from './utils/trpc'

export const APP_NAME = 'Cronus' + (process.env.NODE_ENV === 'development' ? ' Dev' : '')
export const APP_USP = 'The first context-aware, AI distraction and time tracker.'

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

export function MainAppContent(): React.ReactElement {
  const { isAuthenticated, token, justLoggedIn, resetJustLoggedIn, user } = useAuth()
  const { isSettingsOpen, setIsSettingsOpen, setFocusOn } = useSettings()

  // Override localStorage methods to track hasCompletedOnboarding changes
  React.useEffect(() => {
    const originalSetItem = localStorage.setItem
    const originalRemoveItem = localStorage.removeItem
    const originalClear = localStorage.clear

    localStorage.setItem = function (key: string, value: string) {
      if (key === 'hasCompletedOnboarding') {
        console.log('🔍 [PERMISSIONS DEBUG] localStorage.setItem called for hasCompletedOnboarding')
      }
      return originalSetItem.call(this, key, value)
    }

    localStorage.removeItem = function (key: string) {
      if (key === 'hasCompletedOnboarding') {
        console.log(
          '� [PERMISSIONS DEBUG] localStorage.removeItem called for hasCompletedOnboarding'
        )
      }
      return originalRemoveItem.call(this, key)
    }

    localStorage.clear = function () {
      console.log('🔍 [PERMISSIONS DEBUG] localStorage.clear called')
      return originalClear.call(this)
    }

    return () => {
      localStorage.setItem = originalSetItem
      localStorage.removeItem = originalRemoveItem
      localStorage.clear = originalClear
    }
  }, [])
  const [activeWindow, setActiveWindow] = useState<ActiveWindowDetails | null>(null)
  const [isMiniTimerVisible, setIsMiniTimerVisible] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [permissionsChecked, setPermissionsChecked] = useState(false)
  const [missingAccessibilityPermissions, setMissingAccessibilityPermissions] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [isTrackingPaused, setIsTrackingPaused] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [isSystemRestarting, setIsSystemRestarting] = useState(false) // Prevent quit modal during system operations

  const handleSettingsClick = useCallback(() => {
    setIsSettingsOpen(!isSettingsOpen)
  }, [setIsSettingsOpen, isSettingsOpen])

  const handleToggleTracking = useCallback(async () => {
    try {
      if (isTrackingPaused) {
        await window.api.resumeWindowTracking()
        setIsTrackingPaused(false)
      } else {
        await window.api.pauseWindowTracking()
        setIsTrackingPaused(true)
      }
    } catch (error) {
      console.error('Failed to toggle tracking:', error)
    }
  }, [isTrackingPaused])

  const trpcUtils = trpc.useContext()

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true'
    if (isAuthenticated && hasCompletedOnboarding) {
      console.log(
        '🔍 [PERMISSIONS DEBUG] App is loaded, user is authenticated and has completed onboarding. Window tracking is already started by OnboardingModal (ideally).'
      )
      // Note: enablePermissionRequests() and startWindowTracking() are already called by OnboardingModal.tsx
      // Removing redundant calls to prevent race condition with Chrome Apple Events permissions
    }
  }, [isAuthenticated])

  const [isRecategorizeDialogOpen, setIsRecategorizeDialogOpen] = useState(false)
  const [recategorizeTarget, setRecategorizeTarget] = useState<ActivityToRecategorize | null>(null)

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
            title: 'Server Unresponsive',
            description:
              'Hey, sorry the server is unresponsive right now, please try again in a few minutes.',
            variant: 'destructive'
          })
        } else {
          toast({
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
    [recategorizeTarget, token, updateActivityCategoryMutation, toast]
  )

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

  useEffect(() => {
    const checkPermissions = async (): Promise<void> => {
      if (token) {
        try {
          const accessibilityStatus = await window.api.getPermissionStatus(
            PermissionType.Accessibility
          )
          setMissingAccessibilityPermissions(accessibilityStatus !== PermissionStatus.Granted)
        } catch (error) {
          console.error('Failed to check permissions:', error)
          setMissingAccessibilityPermissions(true)
        } finally {
          setPermissionsChecked(true)
        }
      }
    }
    checkPermissions()
  }, [token])

  // Show onboarding only if user hasn't completed it locally (Electron app should show onboarding on each fresh install)
  useEffect(() => {
    console.log('🔍 [ONBOARDING DEBUG] useEffect triggered', {
      permissionsChecked,
      missingAccessibilityPermissions,
      justLoggedIn,
      user: user?.email,
      userHasCompletedOnboarding: user?.hasCompletedOnboarding,
      stack: new Error().stack
    })

    if (!permissionsChecked) {
      console.log('🔍 [ONBOARDING DEBUG] Waiting for permissions check')
      return // Wait for permission check to complete
    }

    // For Electron app, only check localStorage since users might reinstall on different computers
    // and need to grant permissions again. Server-side flag is kept for consistency but not used for decision.
    const hasCompletedOnboardingLocally = localStorage.getItem('hasCompletedOnboarding') === 'true'

    console.log('🔍 [ONBOARDING DEBUG] Checking onboarding status (localStorage only)', {
      hasCompletedOnboardingLocally,
      localStorageValue: localStorage.getItem('hasCompletedOnboarding'),
      allLocalStorageKeys: Object.keys(localStorage),
      serverSideFlag: user?.hasCompletedOnboarding,
      note: 'Using localStorage only for Electron app onboarding decision'
    })

    // Show onboarding only if it hasn't been completed locally
    // Note: Permissions are handled within the onboarding flow itself
    if (!hasCompletedOnboardingLocally) {
      console.log('🚨 [ONBOARDING DEBUG] SHOWING ONBOARDING - not completed locally', {
        hasCompletedOnboardingLocally,
        missingAccessibilityPermissions,
        stack: new Error().stack
      })
      setShowOnboarding(true)
      if (justLoggedIn) {
        resetJustLoggedIn() // Reset the flag if it was set
      }
    } else {
      console.log('🔍 [ONBOARDING DEBUG] Onboarding completed locally, checking tutorial')
      // User has completed onboarding, check if they've seen the tutorial
      const hasSeenTutorial = localStorage.getItem('hasSeenTutorial') === 'true'
      if (!hasSeenTutorial) {
        setShowTutorial(true)
      }
    }
  }, [permissionsChecked, missingAccessibilityPermissions, justLoggedIn, resetJustLoggedIn, user])

  const handleOnboardingComplete = (): void => {
    console.log('🔍 [ONBOARDING DEBUG] handleOnboardingComplete called - starting completion process')
    
    setShowOnboarding(false)
    console.log('🔍 [ONBOARDING DEBUG] Set showOnboarding to false')
    
    // Set the local storage flag to mark onboarding as completed
    const previousValue = localStorage.getItem('hasCompletedOnboarding')
    localStorage.setItem('hasCompletedOnboarding', 'true')
    console.log('🔍 [ONBOARDING DEBUG] localStorage hasCompletedOnboarding set to true', {
      previousValue,
      newValue: localStorage.getItem('hasCompletedOnboarding'),
      timestamp: new Date().toISOString()
    })
    
    if (window.electron?.ipcRenderer) {
      console.log(
        '🔍 [PERMISSIONS DEBUG] Setting open at login to true and enabling permission requests'
      )
      window.electron.ipcRenderer.invoke('set-open-at-login', true)
      // Enable permission requests now that onboarding is complete
      window.electron.ipcRenderer.invoke('enable-permission-requests')
    }
    
    console.log('🔍 [ONBOARDING DEBUG] Invalidating user queries and setting tutorial to show')
    trpcUtils.user.getUserProjectsAndGoals.invalidate()
    setShowTutorial(true)
    
    console.log('🔍 [ONBOARDING DEBUG] handleOnboardingComplete completed successfully')
  }

  const handleResetOnboarding = useCallback((): void => {
    console.log('🔍 [PERMISSIONS DEBUG] Resetting onboarding')
    setShowOnboarding(true)
    // Remove the local storage flag to allow onboarding to show again
    localStorage.removeItem('hasCompletedOnboarding')
  }, [])

  const handleOpenMiniTimer = (): void => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('show-floating-window')
    }
  }

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

  useEffect(() => {
    // Fetch initial state
    const fetchInitialVisibility = async (): Promise<void> => {
      if (window.api?.getFloatingWindowVisibility) {
        try {
          const isVisible = await window.api.getFloatingWindowVisibility()
          setIsMiniTimerVisible(isVisible)
        } catch (error) {
          console.error('Failed to get mini timer visibility', error)
        }
      }
    }

    fetchInitialVisibility()

    // Listener for subsequent changes
    const handleVisibilityChange = (_event: unknown, isVisible: boolean): void => {
      setIsMiniTimerVisible(isVisible)
    }

    const ipcRenderer = window.electron?.ipcRenderer
    ipcRenderer?.on('floating-window-visibility-changed', handleVisibilityChange)
    return () => {
      ipcRenderer?.removeListener('floating-window-visibility-changed', handleVisibilityChange)
    }
  }, [])

  // Auto-show floating window only after user completes onboarding and is authenticated
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true'

    if (
      isAuthenticated &&
      !showOnboarding &&
      hasCompletedOnboarding &&
      window.electron?.ipcRenderer
    ) {
      window.electron.ipcRenderer.send('show-floating-window')
    }
  }, [isAuthenticated, showOnboarding])

  const handleTutorialClose = (): void => {
    setShowTutorial(false)
    localStorage.setItem('hasSeenTutorial', 'true')
  }

  useEffect(() => {
    // Check if user has seen the tutorial
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial') === 'true'
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true'

    // Show tutorial if they've completed onboarding but haven't seen tutorial
    if (hasCompletedOnboarding && !hasSeenTutorial) {
      setShowTutorial(true)
    }
  }, [])

  // Listen for Cmd+Q keyboard shortcut to show quit confirmation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+Q on Mac or Ctrl+Q on other platforms
      if ((event.metaKey || event.ctrlKey) && event.key === 'q') {
        event.preventDefault()

        // Don't show quit modal during system operations or if onboarding not completed
        const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true'
        if (isSystemRestarting || !hasCompletedOnboarding) {
          return
        }

        setShowQuitModal(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSystemRestarting])

  const handleQuitConfirm = async () => {
    try {
      await window.api.confirmQuit()
    } catch (error) {}
  }

  const handleKeepRunning = () => {
    setShowQuitModal(false)
  }

  const handleOpenSettingsFromModal = () => {
    setShowQuitModal(false)
    setIsSettingsOpen(true)
  }

  const handleSystemRestartBegin = useCallback(() => {
    setIsSystemRestarting(true)
  }, [])

  useEffect(() => {
    document.title = APP_NAME
  }, [])

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn('flex flex-col', !isSettingsOpen && 'h-screen')}>
        <div className="sticky top-0 z-50 bg-white dark:bg-black">
          <div className="custom-title-bar">
            <span className="app-window-title">{APP_NAME}</span>
          </div>
          <div className="flex-none p-2">
            <DistractionStatusBar
              activeWindow={activeWindow}
              onOpenMiniTimerClick={handleOpenMiniTimer}
              isMiniTimerVisible={isMiniTimerVisible}
              onOpenRecategorizeDialog={openRecategorizeDialog}
              onSettingsClick={handleSettingsClick}
              isSettingsOpen={isSettingsOpen}
              isTrackingPaused={isTrackingPaused}
              onToggleTracking={handleToggleTracking}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-auto">
          <div className={`flex-1 flex-col min-h-0 ${isSettingsOpen ? 'hidden' : 'flex'}`}>
            <DashboardView />
          </div>
          <div className={`flex-1 flex-col ${isSettingsOpen ? 'flex' : 'hidden'}`}>
            <SettingsPage
              onResetOnboarding={handleResetOnboarding}
              isTrackingPaused={isTrackingPaused}
              onToggleTracking={handleToggleTracking}
            />
          </div>
        </div>

        {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

        <QuitConfirmationModal
          isOpen={showQuitModal}
          onQuit={handleQuitConfirm}
          onKeepRunning={handleKeepRunning}
          onOpenSettings={handleOpenSettingsFromModal}
        />

        <UpdateNotification onRestartBegin={handleSystemRestartBegin} />
        <TutorialModal isFirstVisit={showTutorial} onClose={handleTutorialClose} />
        <Toaster />
        {allCategories && recategorizeTarget && (
          <RecategorizeDialog
            open={isRecategorizeDialogOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setRecategorizeTarget(null)
              }
              setIsRecategorizeDialogOpen(isOpen)
            }}
            activityTarget={recategorizeTarget}
            allCategories={allCategories}
            onSave={handleSaveRecategorize}
            isLoading={updateActivityCategoryMutation.isLoading || isLoadingAllCategories}
            onAddNewCategory={() => {
              setIsRecategorizeDialogOpen(false)
              setRecategorizeTarget(null)
              setIsSettingsOpen(true)
              setFocusOn('categories')
            }}
            setIsSettingsOpen={setIsSettingsOpen}
            setFocusOn={setFocusOn}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
