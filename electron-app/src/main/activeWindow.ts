import { activeWindow } from 'get-windows'

export async function getActiveWindow() {
  return await activeWindow()
}
