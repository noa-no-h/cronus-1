const specialFavicons: Record<string, string> = {
  'docs.google.com': 'https://i.imgur.com/AMyUwdr.png',
  'sheets.google.com':
    'https://www.gstatic.com/marketing-cms/assets/images/6a/a3/2ecde2c245d5b9b88429cb47ee13/google-sheets.webp=s96-fcrop64=1,00000000ffffffff-rw',
  'slides.google.com':
    'https://www.gstatic.com/marketing-cms/assets/images/66/c5/8716b9e44f4d80560a493456e672/google-slides.webp=s96-fcrop64=1,00000000ffffffff-rw',
  'calendar.google.com':
    'https://www.gstatic.com/marketing-cms/assets/images/cf/3c/0d56042f479fac9ad22d06855578/calender.webp=s96-fcrop64=1,00000000ffffffff-rw',
  'meet.google.com':
    'https://www.gstatic.com/marketing-cms/assets/images/23/2e/f8262b124f86a3f1de3e14356cc3/google-meet.webp=s96-fcrop64=1,00000000ffffffff-rw',
  'drive.google.com':
    'https://www.gstatic.com/marketing-cms/assets/images/e8/4f/69d708b2455397d7b88b0312f7c5/google-drive.webp=s96-fcrop64=1,00000000ffffffff-rw'
}

export function getFaviconURL(url: string): string {
  try {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname
    const pathname = parsedUrl.pathname

    if (hostname === 'docs.google.com') {
      if (pathname.startsWith('/spreadsheets')) {
        return specialFavicons['sheets.google.com']
      }
      if (pathname.startsWith('/presentation')) {
        return specialFavicons['slides.google.com']
      }
      return specialFavicons['docs.google.com']
    }

    if (specialFavicons[hostname]) {
      return specialFavicons[hostname]
    }
  } catch (e) {
    // Fall through to original logic for invalid URLs
  }

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
