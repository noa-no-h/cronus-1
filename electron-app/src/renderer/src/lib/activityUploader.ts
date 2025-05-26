import { ActiveWindowDetails } from 'shared'

// Define the type for the mutateAsync function we expect
// This needs to match the signature of the specific mutateAsync function
// from trpc.activeWindowEvents.create.useMutation().mutateAsync
// For simplicity, using a generic Function type here, but ideally, it should be more specific.
// A more specific type might be: (variables: { userId: string; windowId: number; ... }) => Promise<any>
// Let's try to infer it or use a simpler one for now
interface MutateAsyncFunction {
  (variables: any): Promise<any> // Adjust 'any' based on actual input/output of your mutation
}

export const uploadActiveWindowEvent = async (
  userId: string,
  windowDetails: ActiveWindowDetails,
  mutateEvent: MutateAsyncFunction // Accept the mutate function as an argument
): Promise<void> => {
  if (!userId || !windowDetails) {
    // console.log('Skipping upload: userId or windowDetails missing');
    return
  }

  // Map ActiveWindowDetails to the input type expected by the backend
  // The backend expects `windowId` and other fields directly.
  const eventData = {
    userId,
    windowId: windowDetails.windowId,
    ownerName: windowDetails.ownerName,
    type: windowDetails.type,
    browser: windowDetails.browser,
    title: windowDetails.title,
    url: windowDetails.url,
    content: windowDetails.content,
    timestamp: windowDetails.timestamp || Date.now() // Ensure timestamp is present
  }

  console.log('eventData in activityUploader.ts', eventData)

  try {
    // console.log('Uploading active window event:', eventData);
    await mutateEvent(eventData) // Call the passed mutate function
    // console.log('Active window event uploaded successfully');
  } catch (error) {
    console.error('Error uploading active window event:', error)
    // Handle error appropriately, e.g., retry logic, user notification
  }
}
