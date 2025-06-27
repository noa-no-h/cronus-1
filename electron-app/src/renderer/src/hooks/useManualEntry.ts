import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { TimeBlock } from '../lib/dayTimelineHelpers'
import { trpc } from '../utils/trpc'

interface UseManualEntryProps {
  currentTime: Date
  onModalClose?: () => void
}

export const useManualEntry = ({ currentTime, onModalClose }: UseManualEntryProps) => {
  const { token } = useAuth()
  const utils = trpc.useUtils()

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    startTime: { hour: number; minute: number } | null
    endTime: { hour: number; minute: number } | null
    editingEntry: TimeBlock | null
  }>({
    isOpen: false,
    startTime: null,
    endTime: null,
    editingEntry: null
  })

  const createManualEntry = trpc.activeWindowEvents.createManual.useMutation({
    onSuccess: () => {
      utils.activeWindowEvents.getEventsForDateRange.invalidate()
    },
    onError: (error) => {
      console.error('Failed to create manual entry:', error)
      alert('Error: Could not create the entry. Please try again.')
    }
  })

  const updateManualEntry = trpc.activeWindowEvents.updateManual.useMutation({
    onSuccess: () => {
      utils.activeWindowEvents.getEventsForDateRange.invalidate()
    },
    onError: (error) => {
      console.error('Failed to update manual entry:', error)
      alert('Error: Could not update the entry. Please try again.')
    }
  })

  const deleteManualEntry = trpc.activeWindowEvents.deleteManual.useMutation({
    onSuccess: () => {
      utils.activeWindowEvents.getEventsForDateRange.invalidate()
    },
    onError: (error) => {
      console.error('Failed to delete manual entry:', error)
      alert('Error: Could not delete the entry. Please try again.')
    }
  })

  const handleModalClose = () => {
    setModalState({ isOpen: false, startTime: null, endTime: null, editingEntry: null })
    onModalClose?.()
  }

  const handleModalSubmit = (data: { name: string; categoryId?: string }) => {
    if (modalState.editingEntry) {
      if (!token || !modalState.editingEntry._id) return
      updateManualEntry.mutate({
        token,
        id: modalState.editingEntry._id,
        name: data.name,
        categoryId: data.categoryId
      })
    } else if (modalState.startTime && modalState.endTime && token) {
      const getAbsTime = (time: { hour: number; minute: number }) => {
        const date = new Date(currentTime)
        date.setHours(time.hour, time.minute, 0, 0)
        return date.getTime()
      }

      createManualEntry.mutate({
        token,
        name: data.name,
        categoryId: data.categoryId,
        startTime: getAbsTime(modalState.startTime),
        endTime: getAbsTime(modalState.endTime)
      })
    }
    handleModalClose()
  }

  const handleModalDelete = (entryId: string) => {
    if (!token) return
    if (window.confirm('Are you sure you want to delete this entry?')) {
      deleteManualEntry.mutate({ token, id: entryId })
      handleModalClose()
    }
  }

  const handleSelectManualEntry = (entry: TimeBlock) => {
    setModalState({
      isOpen: true,
      startTime: null,
      endTime: null,
      editingEntry: entry
    })
  }

  const openNewEntryModal = (
    startTime: { hour: number; minute: number },
    endTime: { hour: number; minute: number }
  ) => {
    setModalState({ isOpen: true, startTime, endTime, editingEntry: null })
  }

  return {
    modalState,
    handleModalClose,
    handleModalSubmit,
    handleModalDelete,
    handleSelectManualEntry,
    openNewEntryModal,
    updateManualEntry
  }
}
