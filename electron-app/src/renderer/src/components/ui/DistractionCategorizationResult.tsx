interface DistractionCategorizationResultProps {
  activeAppName: string
}

const DistractionCategorizationResult = ({
  activeAppName
}: DistractionCategorizationResultProps) => {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Currently using:</span>
        <span className="text-sm font-medium text-white">
          {activeAppName || 'No active application'}
        </span>
      </div>
    </div>
  )
}

export default DistractionCategorizationResult
