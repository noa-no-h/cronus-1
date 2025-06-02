import { useEffect, useState } from 'react'
import { ActiveWindowDetails } from 'shared'
import ActivitiesByCategoryWidget from './components/ActivitiesByCategoryWidget'
import { AppHeader } from './components/AppHeader'
import CalendarWidget from './components/CalendarWidget'
import { OnboardingModal } from './components/OnboardingModal'
import TopActivityWidget from './components/TopActivityWidget'
import DistractionCategorizationResult from './components/ui/DistractionCategorizationResult'
import { useAuth } from './contexts/AuthContext'
import { uploadActiveWindowEvent } from './lib/activityUploader'
import { trpc } from './utils/trpc'

export function MainAppContent() {
  const { isAuthenticated, token, user } = useAuth()
  const [activeWindow, setActiveWindow] = useState<ActiveWindowDetails | null>(null)
  const [isMiniTimerVisible, setIsMiniTimerVisible] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const eventCreationMutation = trpc.activeWindowEvents.create.useMutation()

  useEffect(() => {
    if (user && !user.hasCompletedOnboarding) {
      setShowOnboarding(true)
    }
  }, [user])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }
  const handleOpenMiniTimer = () => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('show-floating-window')
    }
  }

  useEffect(() => {
    const cleanup = window.api.onActiveWindowChanged((details) => {
      setActiveWindow(details)
      if (details && isAuthenticated && token) {
        uploadActiveWindowEvent(token, details, eventCreationMutation.mutateAsync)
      }
    })
    return cleanup
  }, [isAuthenticated, token, eventCreationMutation.mutateAsync])

  useEffect(() => {
    const handleVisibilityChange = (_event, isVisible: boolean) => {
      setIsMiniTimerVisible(isVisible)
      console.log('App.tsx: Mini timer visibility changed to:', isVisible)
    }
    window.electron?.ipcRenderer?.on('floating-window-visibility-changed', handleVisibilityChange)
    return () => {
      window.electron?.ipcRenderer?.removeListener(
        'floating-window-visibility-changed',
        handleVisibilityChange
      )
    }
  }, [])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="custom-title-bar"></div>
      <AppHeader
        onOpenMiniTimerClick={handleOpenMiniTimer}
        isMiniTimerVisible={isMiniTimerVisible}
      />
      <div className="flex-1 flex flex-row overflow-y-auto min-h-0 p-4 space-y-4">
        <div className="flex flex-col gap-4">
          <DistractionCategorizationResult activeWindow={activeWindow} />
          <ActivitiesByCategoryWidget />
          <TopActivityWidget />
        </div>
        <CalendarWidget />
      </div>
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
    </div>
  )
}
