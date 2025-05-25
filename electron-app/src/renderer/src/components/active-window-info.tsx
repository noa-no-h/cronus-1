import React from 'react'
import { ActiveWindowDetails } from '../../../native-modules/native-windows'

interface ActiveWindowInfoProps {
  windowDetails: ActiveWindowDetails | null
}

export const ActiveWindowInfo: React.FC<ActiveWindowInfoProps> = ({ windowDetails }) => {
  if (!windowDetails) {
    return <div className="text-gray-500">No active window detected</div>
  }

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
      </div>
    </div>
  )
}
