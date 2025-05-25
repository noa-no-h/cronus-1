import path from 'path'

export interface ActiveWindowDetails {
  id: number | string // kCGWindowNumber is usually a number
  ownerName: string
}

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
          const details: ActiveWindowDetails = JSON.parse(jsonString)
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
