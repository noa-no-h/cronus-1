import { ChevronDownIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { Category as SharedCategory } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../hooks/use-toast'
import useActivitySelection from '../../hooks/useActivitySelection'
import { getTimeRangeDescription } from '../../lib/activityMoving'
import {
  ActivityItem,
  ProcessedCategory,
  processActivityEvents
} from '../../lib/activityProcessing'
import { SYSTEM_EVENT_NAMES } from '../../lib/constants'
import { trpc } from '../../utils/trpc'
import type { ProcessedEventBlock } from '../DashboardView'
import { CategoryForm } from '../Settings/CategoryForm'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import ActivityByCategorySkeleton from './ActivityByCategorySkeleton'
import { ActivityList } from './ActivityList'
import { CategorySectionHeader } from './CategorySectionHeader'
import { TimeRangeSelectionInfo } from './TimeRangeSelectionInfo'

interface ActivitiesByCategoryWidgetProps {
  processedEvents: ProcessedEventBlock[] | null
  isLoadingEvents: boolean
  startDateMs: number | null
  endDateMs: number | null
  refetchEvents: () => void
  selectedHour: number | null
  onHourSelect: (hour: number | null) => void
  selectedDay: Date | null
  onDaySelect: (day: Date | null) => void
}

const ActivitiesByCategoryWidget = ({
  processedEvents: todayProcessedEvents,
  isLoadingEvents: isLoadingEventsProp,
  startDateMs,
  endDateMs,
  refetchEvents,
  selectedHour,
  onHourSelect,
  selectedDay,
  onDaySelect
}: ActivitiesByCategoryWidgetProps) => {
  const { token } = useAuth()
  const [processedData, setProcessedData] = useState<ProcessedCategory[]>([])
  const [faviconErrors, setFaviconErrors] = useState<Set<string>>(new Set())
  const [hoveredActivityKey, setHoveredActivityKey] = useState<string | null>(null)
  const [openDropdownActivityKey, setOpenDropdownActivityKey] = useState<string | null>(null)
  const [showMore, setShowMore] = useState<Record<string, boolean>>({})
  const [showSmallCategories, setShowSmallCategories] = useState(false)
  const { selectedActivities, handleSelectActivity, clearSelection } = useActivitySelection(
    processedData,
    showMore
  )
  const [isBulkMoving, setIsBulkMoving] = useState(false)
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)

  const { data: categoriesData, isLoading: isLoadingCategories } =
    trpc.category.getCategories.useQuery({ token: token || '' }, { enabled: !!token })
  const categories = categoriesData as SharedCategory[] | undefined

  const utils = trpc.useUtils()
  const createCategoryMutation = trpc.category.createCategory.useMutation()

  const updateCategoryMutation =
    trpc.activeWindowEvents.updateEventsCategoryInDateRange.useMutation({
      onSuccess: (_data, variables) => {
        refetchEvents()
        const targetCategory = categories?.find((cat) => cat._id === variables.newCategoryId)
        const targetCategoryName = targetCategory ? targetCategory.name : 'Unknown Category'

        toast({
          title: 'Activity Moved',
          description: `${variables.activityIdentifier} moved to ${targetCategoryName} ${getTimeRangeDescription(
            selectedHour,
            selectedDay,
            'day',
            startDateMs,
            endDateMs
          )}.`
        })
      },
      onError: (error) => {
        console.error('Error updating category:', error)
      }
    })

  const bulkUpdateCategoryMutation =
    trpc.activeWindowEvents.updateEventsCategoryInDateRange.useMutation()

  const handleSaveNewCategory = async (
    data: Omit<SharedCategory, '_id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!token) return
    try {
      const newCategory = (await createCategoryMutation.mutateAsync({
        ...data,
        token
      })) as SharedCategory
      await utils.category.getCategories.invalidate({ token: token || '' })
      setIsCreateCategoryOpen(false)
      toast({
        title: 'Category Created',
        description: `Category "${data.name}" has been created.`
      })

      // If there are selected activities, move them to the new category
      const selectedActivitiesToMove = processedData
        .flatMap((cat) => cat.activities)
        .filter((act) => selectedActivities.has(`${act.identifier}-${act.name}`))
      if (selectedActivitiesToMove.length > 0) {
        handleMoveMultipleActivities(selectedActivitiesToMove, newCategory._id)
      }
    } catch (err) {
      toast({
        title: 'Error creating category',
        description: (err as Error).message,
        variant: 'destructive'
      })
    }
  }

  const handleMoveMultipleActivities = async (
    activitiesToMove: ActivityItem[],
    targetCategoryId: string
  ) => {
    if (!token || startDateMs === null || endDateMs === null || activitiesToMove.length === 0) {
      return
    }

    setIsBulkMoving(true)

    const targetCategory = categories?.find((cat) => cat._id === targetCategoryId)
    const targetCategoryName = targetCategory ? targetCategory.name : 'Unknown Category'

    const movePromises = activitiesToMove.map((activity) =>
      bulkUpdateCategoryMutation.mutateAsync({
        token,
        startDateMs,
        endDateMs,
        activityIdentifier: activity.identifier,
        itemType: activity.itemType,
        newCategoryId: targetCategoryId
      })
    )

    try {
      await Promise.all(movePromises)
      refetchEvents()
      toast({
        title: 'Activities Moved',
        description: `${
          activitiesToMove.length
        } activities moved to ${targetCategoryName} ${getTimeRangeDescription(
          selectedHour,
          selectedDay,
          'day',
          startDateMs,
          endDateMs
        )}.`
      })
      clearSelection()
    } catch (error) {
      console.error('Error moving activities:', error)
      toast({
        title: 'Error',
        description: 'Could not move all activities.',
        variant: 'destructive'
      })
    } finally {
      setIsBulkMoving(false)
    }
  }

  const handleAddNewCategory = () => {
    setOpenDropdownActivityKey(null) // close any open dropdowns
    setIsCreateCategoryOpen(true)
  }

  useEffect(() => {
    if (isLoadingCategories || isLoadingEventsProp) {
      setProcessedData([])
      return
    }

    if (!categories || !todayProcessedEvents) {
      setProcessedData([])
      return
    }

    const filteredEvents = todayProcessedEvents.filter(
      (event) => !SYSTEM_EVENT_NAMES.includes(event.name)
    )

    const categoriesMap = new Map<string, SharedCategory>(
      (categories || []).map((cat: SharedCategory) => [cat._id, cat])
    )

    let processedCategoriesResult: ProcessedCategory[] = []

    if (filteredEvents.length === 0) {
      processedCategoriesResult = []
    } else {
      processedCategoriesResult = processActivityEvents(filteredEvents, categoriesMap)
    }

    const finalResult = processedCategoriesResult.sort((a, b) => {
      if (a.isProductive !== b.isProductive) {
        return a.isProductive ? -1 : 1
      }
      return b.totalDurationMs - a.totalDurationMs
    })

    setProcessedData(finalResult)
  }, [categories, todayProcessedEvents, isLoadingCategories, isLoadingEventsProp])

  const handleFaviconError = (identifier: string): void => {
    setFaviconErrors((prev) => new Set(prev).add(identifier))
  }

  const handleMoveActivity = (activity: ActivityItem, targetCategoryId: string) => {
    if (!token || startDateMs === null || endDateMs === null) {
      console.error('Missing token or date range for move operation')
      return
    }
    updateCategoryMutation.mutate({
      token,
      startDateMs,
      endDateMs,
      activityIdentifier: activity.identifier,
      itemType: activity.itemType,
      newCategoryId: targetCategoryId
    })
  }

  const oneMinuteMs = 60 * 1000
  const visibleCategories = processedData.filter((cat) => cat.totalDurationMs >= oneMinuteMs)
  const hiddenCategories = processedData.filter(
    (cat) => cat.totalDurationMs > 0 && cat.totalDurationMs < oneMinuteMs
  )

  const shouldShowAllCategories = visibleCategories.length === 0 && hiddenCategories.length > 0
  const categoriesToShow = shouldShowAllCategories
    ? processedData.filter((c) => c.totalDurationMs > 0)
    : visibleCategories
  const categoriesToHide = shouldShowAllCategories ? [] : hiddenCategories

  const renderCategoryItems = (categoriesToRender: ProcessedCategory[], variant?: 'empty') => {
    return categoriesToRender.map((category) => {
      if (category.totalDurationMs === 0 && variant !== 'empty') return null

      const isAnyActivitySelected = category.activities.some((act) =>
        selectedActivities.has(`${act.identifier}-${act.name}`)
      )
      const otherCategories = categories?.filter((cat) => cat._id !== category.id) || []
      const selectedActivitiesInThisCategory = category.activities.filter((act) =>
        selectedActivities.has(`${act.identifier}-${act.name}`)
      )
      const handleMoveSelected = (targetCategoryId: string) => {
        handleMoveMultipleActivities(selectedActivitiesInThisCategory, targetCategoryId)
      }

      return (
        <div key={category.id}>
          <CategorySectionHeader
            category={category}
            variant={variant}
            isAnyActivitySelected={isAnyActivitySelected}
            otherCategories={otherCategories}
            isMovingActivity={isBulkMoving}
            handleMoveSelected={handleMoveSelected}
            handleClearSelection={clearSelection}
            onAddNewCategory={handleAddNewCategory}
          />
          <ActivityList
            activities={category.activities}
            currentCategory={category}
            allUserCategories={categories}
            handleMoveActivity={handleMoveActivity}
            isMovingActivity={updateCategoryMutation.isLoading}
            faviconErrors={faviconErrors}
            handleFaviconError={handleFaviconError}
            isShowMore={!!showMore[category.id]}
            onToggleShowMore={() =>
              setShowMore((prev) => ({ ...prev, [category.id]: !prev[category.id] }))
            }
            hoveredActivityKey={hoveredActivityKey}
            setHoveredActivityKey={setHoveredActivityKey}
            openDropdownActivityKey={openDropdownActivityKey}
            setOpenDropdownActivityKey={setOpenDropdownActivityKey}
            selectedHour={selectedHour}
            selectedDay={selectedDay}
            viewMode="day"
            startDateMs={startDateMs}
            endDateMs={endDateMs}
            selectedActivities={selectedActivities}
            onSelectActivity={handleSelectActivity}
            onAddNewCategory={handleAddNewCategory}
          />
        </div>
      )
    })
  }

  if (isLoadingEventsProp || isLoadingCategories) {
    return <ActivityByCategorySkeleton />
  }

  if (
    !todayProcessedEvents ||
    todayProcessedEvents.length === 0 ||
    processedData.every((p) => p.totalDurationMs === 0)
  ) {
    return (
      <Card>
        <CardContent className="space-y-4">
          {(!categories || categories.length === 0) &&
            (!todayProcessedEvents || todayProcessedEvents.length === 0) && (
              <p>No activity data for the selected period, or no categories defined.</p>
            )}
          {renderCategoryItems(
            processedData.filter((c) => c.totalDurationMs === 0),
            'empty'
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your activities.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            onSave={handleSaveNewCategory}
            onCancel={() => setIsCreateCategoryOpen(false)}
            isSaving={createCategoryMutation.isLoading}
          />
        </DialogContent>
      </Dialog>
      <Card>
        <CardContent className="space-y-4 px-2 pt-2 pb-3">
          <TimeRangeSelectionInfo
            selectedHour={selectedHour}
            onHourSelect={onHourSelect}
            selectedDay={selectedDay}
            onDaySelect={onDaySelect}
          />
          {renderCategoryItems(categoriesToShow)}
          {categoriesToHide.length > 0 && (
            <Button
              variant="link"
              className="p-1 px-2 mt-2 w-full h-auto text-xs text-left justify-start text-slate-600 dark:text-slate-400 hover:text-foreground transition-colors flex items-center gap-1"
              onClick={() => setShowSmallCategories(!showSmallCategories)}
            >
              {showSmallCategories
                ? 'Show less'
                : `Show ${categoriesToHide.length} more categories`}
              <ChevronDownIcon
                className={`ml-.5 h-4 w-4 transition-transform duration-200 ${
                  showSmallCategories ? 'rotate-180' : ''
                }`}
              />
            </Button>
          )}
          <AnimatePresence>
            {showSmallCategories && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {renderCategoryItems(categoriesToHide)}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </>
  )
}

export default React.memo(ActivitiesByCategoryWidget)
