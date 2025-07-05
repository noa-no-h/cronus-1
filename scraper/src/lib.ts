import { RequestError } from '@octokit/request-error';
import { JSDOM } from 'jsdom';
import { Octokit } from 'octokit';

export const scaperDBName = 'cronus-scraper';

export async function withRateLimitHandling<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 5
): Promise<T | null> {
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < maxRetries) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;

      // Handle rate limit errors
      if (
        error instanceof RequestError &&
        (error.status === 403 || error.status === 429) &&
        error.response?.headers['x-ratelimit-remaining'] === '0'
      ) {
        const resetTimestamp = error.response?.headers['x-ratelimit-reset'];
        if (resetTimestamp) {
          const resetTime = Number(resetTimestamp) * 1000;
          const waitTimeMs = Math.max(resetTime - Date.now(), 0) + 1000; // Add a 1s buffer
          const waitTimeMinutes = (waitTimeMs / 60000).toFixed(2);
          const resetTimeFormatted = new Date(resetTime).toLocaleString();

          console.log(
            `Rate limit exceeded. Waiting for ${waitTimeMinutes} minutes until reset (${resetTimeFormatted}). (Attempt ${
              retryCount + 1
            }/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
          retryCount++;
          continue;
        }
      }

      // Handle server errors (5xx) with exponential backoff
      if (error instanceof RequestError && error.status >= 500 && error.status < 600) {
        const retryAfterSeconds = Math.min(Math.pow(2, retryCount) * 2, 60); // Exponential backoff, max 60s
        console.log(
          `Server error (${error.status}). Retrying in ${retryAfterSeconds} seconds... (Attempt ${
            retryCount + 1
          }/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
        retryCount++;
        continue;
      }

      console.error('An unexpected API error occurred in withRateLimitHandling:', error);
      throw error;
    }
  }

  console.error(`Max retries (${maxRetries}) exceeded. Last error: ${lastError?.message}`);
  return null;
}

export async function fetchBasicUserData(octokit: Octokit, username: string) {
  const userData = await withRateLimitHandling(() =>
    octokit.request('GET /users/{username}', {
      username,
    })
  );
  if (!userData) {
    throw new Error(`Failed to fetch basic user data for ${username} after retrying.`);
  }

  return {
    login: userData.data.login,
    profileUrl: userData.data.html_url || '',
    createdAt: userData.data.created_at,
    followers: userData.data.followers,
    following: userData.data.following,
    name: userData.data.name || null,
    bio: userData.data.bio || null,
    company: userData.data.company || null,
    blog: userData.data.blog || null,
    location: userData.data.location || null,
    normalizedLocation: userData.data.location || null,
    email: userData.data.email || null,
    twitter_username: userData.data.twitter_username || null,
    xUrl: null,
    xBio: null,
    xName: null,
    xLocation: null,
    public_repos: userData.data.public_repos,
  };
}

export async function fetchUserEmailFromEvents(
  username: string,
  octokit: Octokit
): Promise<string | null> {
  let mostRecentNoreplyEmail: string | null = null;
  const MAX_PAGES_TO_CHECK = 3;

  try {
    for (let page = 1; page <= MAX_PAGES_TO_CHECK; page++) {
      const eventsResponse = await withRateLimitHandling(() =>
        octokit.request('GET /users/{username}/events/public', {
          username,
          per_page: 100,
          page,
        })
      );
      if (!eventsResponse) {
        break;
      }
      const events = eventsResponse.data;

      if (events.length === 0) {
        break; // No more events to check
      }

      for (const event of events) {
        if (event.type === 'PushEvent' && event.payload) {
          const payload = event.payload as any;
          if (payload.commits && payload.commits.length > 0) {
            for (const commit of payload.commits) {
              if (commit.author && commit.author.email) {
                const email = commit.author.email as string;
                // Skip bot emails and GitHub Actions emails
                if (email.includes('[bot]') || email.includes('github-actions')) {
                  continue;
                }
                // Prefer non-noreply emails
                if (!email.endsWith('@users.noreply.github.com')) {
                  return email; // Found a non-noreply email, return immediately
                }
                // Keep track of the first noreply email encountered (which will be the most recent)
                if (!mostRecentNoreplyEmail) {
                  mostRecentNoreplyEmail = email;
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      // It can happen for suspended accounts
      console.warn(`Could not fetch events for ${username} (404)`);
    } else {
      console.error(`Error fetching events for ${username}:`, error);
    }
  }
  return mostRecentNoreplyEmail;
}

export async function fetchXProfileMetadata(username: string): Promise<{
  bio: string | null;
  name: string | null;
  location: string | null;
} | null> {
  if (!username) return null;

  try {
    const url = `https://x.com/${username}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PrimeIntellectBot/1.0;)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`Error fetching X profile ${username}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const doc = new JSDOM(html);
    const meta = doc.window.document.getElementsByTagName('meta');

    const metadata: {
      bio: string | null;
      name: string | null;
      location: string | null;
    } = {
      bio: null,
      name: null,
      location: null,
    };

    // Extract OpenGraph metadata
    for (const tag of meta) {
      const property = tag.getAttribute('property');
      const content = tag.getAttribute('content');

      if (!content) continue;

      switch (property) {
        case 'og:description':
          metadata.bio = content;
          break;
        case 'og:title':
          metadata.name = content;
          break;
        case 'og:site_name':
          if (content.includes('X (formerly Twitter)')) {
            // Try to find location in the page content
            const locationElement = doc.window.document.querySelector(
              '[data-testid="UserLocation"]'
            );
            if (locationElement) {
              metadata.location = locationElement.textContent;
            }
          }
          break;
      }
    }

    return metadata;
  } catch (error) {
    console.error(`Error fetching X profile for ${username}:`, error);
    return null;
  }
}
