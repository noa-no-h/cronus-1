import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { ActiveWindowDetails } from 'shared'
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
  userId: string
  windowId: number
  ownerName: string
  type: 'window' | 'browser'
  browser?: 'chrome' | 'safari' | null
  title: string
  url?: string | null
  content?: string | null
  timestamp: number
  screenshotS3Url?: string
}

export const uploadActiveWindowEvent = async (
  userId: string,
  windowDetails: ActiveWindowDetails,
  mutateEvent: MutateAsyncFunction
): Promise<void> => {
  if (!userId || !windowDetails) {
    return
  }

  // Map ActiveWindowDetails to the input type expected by the backend
  const eventData: EventData = {
    userId,
    windowId: windowDetails.windowId,
    ownerName: windowDetails.ownerName,
    type: windowDetails.type,
    browser: windowDetails.browser,
    title: windowDetails.title,
    url: windowDetails.url,
    content: windowDetails.content,
    timestamp: windowDetails.timestamp || Date.now()
  }

  try {
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

    // Upload the event data
    await mutateEvent(eventData)
  } catch (error) {
    console.error('Error uploading active window event:', error)
    // Handle error appropriately, e.g., retry logic, user notification
  }
}
