import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { ActiveWindowDetails } from 'shared'
import { isVeryLikelyProductive } from 'shared/distractionRules'
import type { AppRouter } from '../../../../../server/src'
import { deleteLocalFile, readFileFromMain, uploadToS3 } from './s3Uploader'

// Create a tRPC client for use outside of React components
const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/trpc',
      headers() {
        const token = localStorage.getItem('accessToken')
        return {
          Authorization: token ? `Bearer ${token}` : ''
        }
      }
    })
  ]
})

// Define the type for the mutateAsync function we expect
interface MutateAsyncFunction {
  (variables: any): Promise<any>
}

// Define the event data type
interface EventData {
  token: string
  windowId?: number
  ownerName: string
  type: 'window' | 'browser' | 'system'
  browser?: 'chrome' | 'safari' | null
  title: string
  url?: string | null
  content?: string | null
  timestamp: number
  screenshotS3Url?: string
}

export const uploadActiveWindowEvent = async (
  token: string,
  windowDetails: ActiveWindowDetails,
  mutateEvent: MutateAsyncFunction
): Promise<void> => {
  if (!token || !windowDetails) {
    console.log('Skipping event upload - missing token or details:', {
      token: !!token,
      details: !!windowDetails
    })
    return
  }

  const isSystemEvent = ['System Sleep', 'System Wake', 'System Lock', 'System Unlock'].includes(
    windowDetails.ownerName
  )

  // Map ActiveWindowDetails to the input type expected by the backend
  const eventData: EventData = {
    token,
    windowId: isSystemEvent ? 0 : windowDetails.windowId,
    ownerName: windowDetails.ownerName,
    type: isSystemEvent ? 'system' : windowDetails.type,
    browser: windowDetails.browser,
    title: windowDetails.title,
    url: windowDetails.url,
    content: windowDetails.content,
    timestamp: windowDetails.timestamp || Date.now(),
    screenshotS3Url: windowDetails.screenshotS3Url ?? undefined
  }

  try {
    if (!isSystemEvent) {
      // Only handle screenshots for non-system events
      // dont burden s3 with too many image if 99% likelyhood of it being productive
      if (isVeryLikelyProductive(windowDetails)) {
        if (windowDetails.localScreenshotPath) {
          await deleteLocalFile(windowDetails.localScreenshotPath)
        }
      } else {
        // If we have a local screenshot, upload it to S3 first
        if (windowDetails.localScreenshotPath) {
          try {
            // Get pre-signed URL from server
            const { uploadUrl, publicUrl } = await trpcClient.s3.getUploadUrl.mutate({
              fileType: 'image/jpeg',
              token: localStorage.getItem('accessToken') || ''
            })

            // Read the local file from the main process (no checksum)
            const fileBuffer = await readFileFromMain(windowDetails.localScreenshotPath)

            // Upload to S3 with content type
            await uploadToS3(uploadUrl, fileBuffer, 'image/jpeg')

            // Add the S3 URL to the event data
            eventData.screenshotS3Url = publicUrl

            // Clean up the local file
            await deleteLocalFile(windowDetails.localScreenshotPath)
          } catch (error) {
            console.error('Error handling screenshot upload:', error)
            // Continue with event upload even if screenshot upload fails
          }
        }
      }
    }

    // Upload the event data
    await mutateEvent(eventData)
  } catch (error) {
    console.error('Error uploading active window event:', error)
    // Handle error appropriately, e.g., retry logic, user notification
  }
}
