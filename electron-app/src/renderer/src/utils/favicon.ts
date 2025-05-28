export function getFaviconURL(url: string): string {
  const root = getRootOfURL(url)
  return getFaviconUrlFromDuckDuckGo(root)
}

function getRootOfURL(url: string): string {
  try {
    return new URL(url).hostname
  } catch (e) {
    return ''
  }
}

function getFaviconUrlFromDuckDuckGo(baseDomain: string): string {
  return `https://icons.duckduckgo.com/ip3/${baseDomain}.ico`
}
