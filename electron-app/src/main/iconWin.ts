import { nativeImage } from 'electron'

export function getAppIconDataUrl(exePath: string, size: 16 | 32 | 64 | 256 = 64): string | null {
  // Only require on Windows
  if (process.platform !== 'win32') return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const extractIcon = require('extract-file-icon')
    const iconBuffer = extractIcon(exePath, size)
    if (!iconBuffer) return null
    const image = nativeImage.createFromBuffer(iconBuffer)
    return image.toDataURL()
  } catch (e) {
    console.error('Failed to extract icon:', e)
    return null
  }
}
