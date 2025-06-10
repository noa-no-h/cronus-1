// Helper function to convert hex to rgba
export const hexToRgba = (hex: string, alpha: number): string => {
  if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) {
    // Basic hex validation
    return `rgba(128, 128, 128, ${alpha})` // Default gray if hex is invalid
  }
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
