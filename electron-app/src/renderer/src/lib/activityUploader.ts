import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { ActiveWindowDetails } from 'shared/dist/types.js'
import { isVeryLikelyProductive } from 'shared/distractionRules'
import type { AppRouter } from '../../../../../server/src/index'
import { SYSTEM_EVENT_NAMES } from './constants'
import { deleteLocalFile, readFileFromMain, uploadToS3 } from './s3Uploader'

// Create a tRPC client for use outside of React components
const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_SERVER_URL || 'http://localhost:3001/trpc',
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
  // Don't upload browser events that are missing a URL.
  if (
    (windowDetails.browser === 'chrome' || windowDetails.browser === 'safari') &&
    !windowDetails.url
  ) {
    console.log('Skipping browser event upload: missing URL.', windowDetails)
    return
  }

  if (!token || !windowDetails) {
    console.log('Skipping event upload - missing token or details:', {
      token: !!token,
      details: !!windowDetails
    })
    return
  }

  const isSystemEvent = SYSTEM_EVENT_NAMES.includes(windowDetails.ownerName)

  // Map ActiveWindowDetails to the input type expected by the backend
  const eventData: EventData = {
    token,
    windowId: isSystemEvent ? 0 : windowDetails.windowId,
    ownerName: windowDetails.ownerName,
    type: isSystemEvent ? 'system' : windowDetails.type,
    browser: windowDetails.browser,
    title: windowDetails.title,
    url: windowDetails.url,
    content: windowDetails.content, // Content already provided by native code
    timestamp: windowDetails.timestamp || Date.now(),
    screenshotS3Url: windowDetails.screenshotS3Url ?? undefined
  }

  try {
    if (!isSystemEvent) {
      // Handle screenshot upload logic (unchanged)
      if (isVeryLikelyProductive(windowDetails)) {
        if (windowDetails.localScreenshotPath) {
          console.log(
            `[ActivityUploader] Productive app detected (${windowDetails.ownerName}), deleting screenshot.`
          )
          await deleteLocalFile(windowDetails.localScreenshotPath)
        }
      } else {
        if (windowDetails.localScreenshotPath) {
          try {
            console.log(
              `[ActivityUploader] Non-productive app, attempting screenshot upload for: ${windowDetails.title}`
            )
            const { uploadUrl, publicUrl } = await trpcClient.s3.getUploadUrl.mutate({
              fileType: 'image/jpeg',
              token: localStorage.getItem('accessToken') || ''
            })

            const fileBuffer = await readFileFromMain(windowDetails.localScreenshotPath)
            await uploadToS3(uploadUrl, fileBuffer, 'image/jpeg')

            eventData.screenshotS3Url = publicUrl
            console.log('[ActivityUploader] Screenshot uploaded, event data being sent:', eventData)
            await deleteLocalFile(windowDetails.localScreenshotPath)
          } catch (error) {
            console.error('Error handling screenshot upload:', error)
          }
        } else {
          console.log(
            `[ActivityUploader] No screenshot available for non-productive app: ${windowDetails.ownerName}`
          )
        }
      }
    }

    console.log(
      `[ActivityUploader] Uploading event for ${windowDetails.ownerName} with ${windowDetails.content?.length || 0} chars content`
    )
    await mutateEvent(eventData)
  } catch (error) {
    console.error('Error in uploadActiveWindowEvent:', error)
  }
}
