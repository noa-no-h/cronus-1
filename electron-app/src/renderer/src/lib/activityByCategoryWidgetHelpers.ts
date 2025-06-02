export const formatDuration = (ms: number): string => {
  if (ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  // const seconds = totalSeconds % 60 // Seconds not shown if minutes or hours are present in screenshot

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m`
  }
  if (totalSeconds > 0) {
    return `${totalSeconds}s`
  }
  return '0s'
}

export const extractWebsiteInfo = (
  url: string,
  title: string
): { domain: string; name: string } => {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace(/^www\./, '')

    let cleanTitle = title
      .replace(/ - Google Chrome$/i, '')
      .replace(/ - Chrome$/i, '')
      .replace(/ - Safari$/i, '')
      .replace(/ - Microsoft\ Edge$/i, '')
      .replace(/ - Firefox$/i, '')
      .replace(/^\([0-9]+\) /, '') // Remove notification counts like "(2) Gmail"
      .trim()

    if (!cleanTitle || cleanTitle.length < 3 || cleanTitle.toLowerCase() === domain.toLowerCase()) {
      cleanTitle = domain // Fallback to domain if title is not descriptive or same as domain
    }
    return { domain, name: cleanTitle }
  } catch {
    return { domain: 'unknown', name: title || 'Unknown Website' }
  }
}
