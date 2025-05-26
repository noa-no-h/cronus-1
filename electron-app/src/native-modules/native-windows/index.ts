import path from 'path'
import { ActiveWindowDetails } from '../../../../shared/types'

interface Addon {
  startActiveWindowObserver: (callback: (jsonString: string) => void) => void
  stopActiveWindowObserver: () => void
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const addon: Addon = require(
  path.join(
    process.cwd(),
    'src',
    'native-modules',
    'native-windows',
    'build',
    'Release',
    'nativeWindows.node'
  )
)

class NativeWindows {
  /**
   * Subscribes to active window changes
   */
  public startActiveWindowObserver(callback: (details: ActiveWindowDetails | null) => void) {
    addon.startActiveWindowObserver((jsonString: string) => {
      try {
        if (jsonString) {
          const detailsJson = JSON.parse(jsonString)
          // Ensure that the id field from the native module is mapped to windowId
          const details: ActiveWindowDetails = {
            ...detailsJson,
            windowId: detailsJson.id
          }
          delete (details as any).id // remove original id if it exists to avoid confusion
          callback(details)
        } else {
          callback(null) // Should not happen if native code sends valid JSON or calls back appropriately for errors
        }
      } catch (error) {
        console.error('Error parsing window details JSON:', error, 'Received string:', jsonString)
        callback(null)
      }
    })
  }

  public stopActiveWindowObserver() {
    addon.stopActiveWindowObserver()
  }
}

export const nativeWindows = new NativeWindows()
