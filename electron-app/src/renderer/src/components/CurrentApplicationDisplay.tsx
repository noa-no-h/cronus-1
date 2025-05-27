interface CurrentApplicationDisplayProps {
  appName: string | null
}

export function CurrentApplicationDisplay({
  appName
}: CurrentApplicationDisplayProps): React.JSX.Element {
  return (
    <div className="sticky top-16 z-20 bg-gray-800 border-b border-gray-700 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Currently using:</span>
        <span className="text-sm font-medium text-white">{appName || 'No active application'}</span>
      </div>
    </div>
  )
}
