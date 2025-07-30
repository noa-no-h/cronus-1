import { endOfDay, startOfDay } from 'date-fns'
import { useState } from 'react'
import type { TimeBlock } from '../lib/dayTimelineHelpers'
import { trpc } from '../utils/trpc'
import { toast } from './use-toast'

interface UseManualEntryProps {
  baseDate: Date
  onModalClose?: () => void
  token: string | null
  userId: string | null
}

export const useManualEntry = ({ baseDate, onModalClose, token, userId }: UseManualEntryProps) => {
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

  const getQueryInput = () => ({
    token: token || '',
    startDateMs: startOfDay(baseDate).getTime(),
    endDateMs: endOfDay(baseDate).getTime()
  })

  const createManualEntry = trpc.activeWindowEvents.createManual.useMutation({
    onMutate: async (newEntry) => {
      const queryInput = getQueryInput()
      await utils.activeWindowEvents.getEventsForDateRange.cancel(queryInput)
      const previousEvents = utils.activeWindowEvents.getEventsForDateRange.getData(queryInput)

      const tempId = `temp-${Date.now()}`

      utils.activeWindowEvents.getEventsForDateRange.setData(queryInput, (oldData) => {
        const optimisticEntry: any = {
          _id: tempId,
          userId: userId,
          ownerName: 'manual',
          type: 'manual',
          title: newEntry.name,
          timestamp: newEntry.startTime,
          durationMs: newEntry.endTime - newEntry.startTime,
          categoryId: newEntry.categoryId
        }
        return oldData ? [...oldData, optimisticEntry] : [optimisticEntry]
      })

      return { previousEvents, tempId }
    },
    onSuccess: (data, _variables, context) => {
      if (context?.tempId) {
        const queryInput = getQueryInput()
        utils.activeWindowEvents.getEventsForDateRange.setData(queryInput, (oldData) => {
          return oldData?.map((event) => (event._id === context.tempId ? data : event)) || []
        })
      }
    },
    onError: (err, newEntry, context) => {
      const queryInput = getQueryInput()
      if (context?.previousEvents) {
        utils.activeWindowEvents.getEventsForDateRange.setData(queryInput, context.previousEvents)
      }
      console.error('Failed to create manual entry:', err)
      alert('Error: Could not create the entry. Please try again.')
    },
    onSettled: () => {
      const queryInput = getQueryInput()
      utils.activeWindowEvents.getEventsForDateRange.invalidate(queryInput)
      utils.activeWindowEvents.getManualEntryHistory.invalidate()
    }
  })

  const updateManualEntry = trpc.activeWindowEvents.updateManual.useMutation({
    onMutate: async (updatedEntry) => {
      const queryInput = getQueryInput()
      await utils.activeWindowEvents.getEventsForDateRange.cancel(queryInput)
      const previousEvents = utils.activeWindowEvents.getEventsForDateRange.getData(queryInput)

      utils.activeWindowEvents.getEventsForDateRange.setData(queryInput, (oldData) => {
        return (
          oldData?.map((event) => {
            if (event._id === updatedEntry.id) {
              const newTimestamp = updatedEntry.startTime ?? event.timestamp
              const durationMs = updatedEntry.durationMs ?? event.durationMs

              return {
                ...event,
                title: updatedEntry.name ?? event.title,
                categoryId: updatedEntry.categoryId ?? event.categoryId,
                timestamp: newTimestamp,
                durationMs
              }
            }
            return event
          }) || []
        )
      })

      return { previousEvents }
    },
    onError: (err, newEntry, context) => {
      const queryInput = getQueryInput()
      if (context?.previousEvents) {
        utils.activeWindowEvents.getEventsForDateRange.setData(queryInput, context.previousEvents)
      }
      console.error('Failed to update manual entry:', err)
      alert('Error: Could not update the entry. Please try again.')
    },
    onSettled: () => {
      const queryInput = getQueryInput()
      utils.activeWindowEvents.getEventsForDateRange.invalidate(queryInput)
    }
  })

  const deleteManualEntry = trpc.activeWindowEvents.deleteManual.useMutation({
    onMutate: async ({ id }) => {
      const queryInput = getQueryInput()
      await utils.activeWindowEvents.getEventsForDateRange.cancel(queryInput)
      const previousEvents = utils.activeWindowEvents.getEventsForDateRange.getData(queryInput)

      utils.activeWindowEvents.getEventsForDateRange.setData(
        queryInput,
        (oldData) => oldData?.filter((event) => event._id !== id) || []
      )

      return { previousEvents }
    },
    onError: (err, newEntry, context) => {
      const queryInput = getQueryInput()
      if (context?.previousEvents) {
        utils.activeWindowEvents.getEventsForDateRange.setData(queryInput, context.previousEvents)
      }
      console.error('Failed to delete manual entry:', err)
      alert('Error: Could not delete the entry. Please try again.')
    },
    onSettled: () => {
      const queryInput = getQueryInput()
      utils.activeWindowEvents.getEventsForDateRange.invalidate(queryInput)
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
        const date = new Date(baseDate)
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
    deleteManualEntry.mutate({ token, id: entryId })
    handleModalClose()
    toast({
      title: 'Entry deleted successfully',
      description: 'The entry has been deleted successfully'
    })
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
