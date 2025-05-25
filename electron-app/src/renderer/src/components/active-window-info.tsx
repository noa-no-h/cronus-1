import React from 'react'
import { ActiveWindowDetails } from '../../../native-modules/native-windows'

interface ActiveWindowInfoProps {
  windowDetails: ActiveWindowDetails | null
}

export const ActiveWindowInfo: React.FC<ActiveWindowInfoProps> = ({ windowDetails }) => {
  if (!windowDetails) {
    return <div className="text-gray-500">No active window detected</div>
  }

  // Truncate content if it's too long
  const truncatedContent =
    windowDetails.content && windowDetails.content.length > 500
      ? `${windowDetails.content.substring(0, 500)}...`
      : windowDetails.content

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-800">Application:</span>
          <span className="text-gray-800">{windowDetails.ownerName}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-800">Title:</span>
          <span className="truncate text-gray-800">{windowDetails.title}</span>
        </div>

        {windowDetails.type === 'chrome' && windowDetails.url && (
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-800">URL:</span>
            <a
              href={windowDetails.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate text-gray-800"
            >
              {windowDetails.url}
            </a>
          </div>
        )}

        {windowDetails.type === 'chrome' && windowDetails.content && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Content Preview:</span>
                {windowDetails.content.length > 500 && (
                  <span className="text-xs text-gray-500">
                    {windowDetails.content.length} characters
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-48 overflow-y-auto whitespace-pre-wrap">
                {truncatedContent}
              </div>
            </div>
          </div>
        )}

        {windowDetails.timestamp && (
          <div className="text-xs text-gray-500 mt-2">
            Last updated: {new Date(windowDetails.timestamp * 1000).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}
