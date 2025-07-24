import { createWorker } from 'tesseract.js'
import { desktopCapturer, nativeImage } from 'electron'

// Helper to capture the active window as a PNG buffer
export async function captureActiveWindowImage(): Promise<Buffer | null> {
  // Get all available sources (windows/screens)
  const sources = await desktopCapturer.getSources({ types: ['window'], fetchWindowIcons: false })
  // Find the active window (this is a simplification; you may want to match by title/process)
  const activeSource = sources[0] // You may want to improve this selection logic!
  if (!activeSource) return null
  const image = nativeImage.createFromDataURL(activeSource.thumbnail.toDataURL())
  return image.toPNG()
}

// Run OCR on a PNG buffer
export async function runOcrOnImage(imageBuffer: Buffer): Promise<string> {
  const worker = await createWorker('eng')
  const { data } = await worker.recognize(imageBuffer)
  await worker.terminate()
  return data.text
}

// Main function to capture and OCR the active window
export async function getActiveWindowOcrText(): Promise<string | null> {
  const imageBuffer = await captureActiveWindowImage()
  if (!imageBuffer) return null
  return await runOcrOnImage(imageBuffer)
}
