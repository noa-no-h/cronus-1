import { Db } from 'mongodb';
import { Octokit } from 'octokit';
import { throttling } from '@octokit/plugin-throttling';
import { fetchBasicUserData, fetchUserEmailFromEvents, fetchXProfileMetadata } from './lib';

type InteractionType = 'stargazer' | 'watcher' | 'forker' | 'contributor';

const ThrottledOctokit = Octokit.plugin(throttling);

const octokit = new ThrottledOctokit({
  auth: process.env.GITHUB_TOKEN,
  throttle: {
    onRateLimit: (retryAfter, options, octokit, retryCount) => {
      octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
      if (retryCount < 5) {
        octokit.log.info(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
    },
    onSecondaryRateLimit: (retryAfter, options, octokit, retryCount) => {
      octokit.log.warn(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);
      if (retryCount < 5) {
        octokit.log.info(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
    },
  },
});

async function scrapeUserProfile(username: string) {
  console.log(`Scraping profile for ${username}...`);
  const basicInfo = await fetchBasicUserData(octokit, username);
  const emailFromEvents = await fetchUserEmailFromEvents(username, octokit);
  let xProfile = null;
  if (basicInfo.twitter_username) {
    xProfile = await fetchXProfileMetadata(basicInfo.twitter_username);
  }
  return {
    ...basicInfo,
    email: basicInfo.email || emailFromEvents,
    xUrl: xProfile ? `https://x.com/${basicInfo.twitter_username}` : null,
    xBio: xProfile?.bio || null,
    xName: xProfile?.name || null,
    xLocation: xProfile?.location || null,
  };
}

async function scrapeGraphQLInteractions(
  owner: string,
  repo: string,
  interactionType: 'stargazer' | 'watcher' | 'forker',
  db: Db
): Promise<void> {
  const collection = db.collection('users');
  const progressCollection = db.collection('scraper_progress');

  const progress = await progressCollection.findOne({ owner, repo, interactionType });

  const connectionMap = {
    stargazer: 'stargazers',
    watcher: 'watchers',
    forker: 'forks',
  };
  const connectionName = connectionMap[interactionType];
  const fieldProjection = interactionType === 'forker' ? 'owner { login }' : 'login';

  const query = /* GraphQL */ `
    query GetInteractions($owner: String!, $repo: String!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        ${connectionName}(first: 100, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            ${fieldProjection}
          }
        }
      }
    }
  `;

  let hasNextPage = true;
  let cursor: string | null = progress ? progress.lastCompletedCursor : null;
  if (cursor) {
    console.log(
      `[RESUME] Resuming ${interactionType} scrape for ${owner}/${repo} from cursor: ${cursor}`
    );
  } else {
    console.log(`[START] Starting new ${interactionType} scrape for ${owner}/${repo}.`);
  }

  while (hasNextPage) {
    console.log(
      `Scraping ${interactionType}s for ${owner}/${repo}` +
        (cursor ? ` (from cursor: ${cursor})` : '')
    );
    const result: any = await octokit.graphql(query, { owner, repo, cursor });
    const interactions = result.repository[connectionName];

    const CONCURRENCY_LIMIT = 5;
    const chunks = [];
    for (let i = 0; i < interactions.nodes.length; i += CONCURRENCY_LIMIT) {
      chunks.push(interactions.nodes.slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (node: any) => {
        const login = interactionType === 'forker' ? node.owner?.login : node.login;
        if (login) {
          try {
            console.log(`- ${login}`);
            const userProfile = await scrapeUserProfile(login);
            await collection.updateOne(
              { login: userProfile.login },
              {
                $set: userProfile,
                $addToSet: {
                  repositoryInteractions: {
                    interactionType,
                    repositoryName: repo,
                    repositoryOwner: owner,
                  },
                },
              },
              { upsert: true }
            );
            return true;
          } catch (error) {
            console.error(`Error processing ${interactionType} ${login}:`, error);
            return false;
          }
        }
        return false;
      });
      await Promise.all(promises);
    }

    hasNextPage = interactions.pageInfo.hasNextPage;
    cursor = interactions.pageInfo.endCursor;
    if (cursor) {
      await progressCollection.updateOne(
        { owner, repo, interactionType },
        { $set: { lastCompletedCursor: cursor, lastScrapedAt: new Date() } },
        { upsert: true }
      );
    }
  }
}

async function scrapeContributors(owner: string, repo: string, db: Db): Promise<void> {
  const collection = db.collection('users');
  const progressCollection = db.collection('scraper_progress');
  const interactionType = 'contributor';

  const progress = await progressCollection.findOne({ owner, repo, interactionType });

  let page = progress ? progress.lastCompletedPage + 1 : 1;
  if (progress) {
    console.log(`[RESUME] Resuming contributor scrape for ${owner}/${repo} from page: ${page}`);
  } else {
    console.log(`[START] Starting new contributor scrape for ${owner}/${repo}.`);
  }

  let hasNextPage = true;
  while (hasNextPage) {
    console.log(`Scraping contributors for ${owner}/${repo}, page ${page}...`);
    const response = await octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: 100,
      page,
    });

    const contributors = response.data;
    if (contributors.length === 0) {
      hasNextPage = false;
      break;
    }

    const CONCURRENCY_LIMIT = 5;
    const chunks = [];
    for (let i = 0; i < contributors.length; i += CONCURRENCY_LIMIT) {
      chunks.push(contributors.slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (contributor: any) => {
        if (contributor && contributor.login) {
          try {
            console.log(`- ${contributor.login} (${contributor.contributions} contributions)`);
            const userProfile = await scrapeUserProfile(contributor.login);
            await collection.updateOne(
              { login: userProfile.login },
              {
                $set: userProfile,
                $addToSet: {
                  repositoryInteractions: {
                    interactionType,
                    repositoryName: repo,
                    repositoryOwner: owner,
                    contributions: contributor.contributions,
                  },
                },
              },
              { upsert: true }
            );
            return true;
          } catch (error) {
            console.error(`Error processing contributor ${contributor.login}:`, error);
            return false;
          }
        }
        return false;
      });
      await Promise.all(promises);
    }

    await progressCollection.updateOne(
      { owner, repo, interactionType },
      { $set: { lastCompletedPage: page, lastScrapedAt: new Date() } },
      { upsert: true }
    );
    page++;
  }
}

export async function scrapeAllInteractionsForRepo(
  owner: string,
  repo: string,
  db: Db
): Promise<void> {
  try {
    const truthQuery = /* GraphQL */ `
      query GetInteractionCounts($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          stargazers {
            totalCount
          }
          watchers {
            totalCount
          }
          forks {
            totalCount
          }
        }
      }
    `;
    const truthCounts: any = await octokit.graphql(truthQuery, { owner, repo });
    const apiTotals = {
      stargazer: truthCounts.repository.stargazers.totalCount,
      watcher: truthCounts.repository.watchers.totalCount,
      forker: truthCounts.repository.forks.totalCount,
    };

    for (const type of ['stargazer', 'watcher', 'forker'] as const) {
      await scrapeGraphQLInteractions(owner, repo, type, db);
      const dbCount = await db.collection('users').countDocuments({
        'repositoryInteractions.interactionType': type,
        'repositoryInteractions.repositoryOwner': owner,
        'repositoryInteractions.repositoryName': repo,
      });
      const apiTotal = apiTotals[type];
      if (dbCount < apiTotal) {
        console.warn(
          `[RE-SCRAPE] Discrepancy for ${type}s in ${owner}/${repo}. DB: ${dbCount}, API: ${apiTotal}. Starting full re-scrape.`
        );
        await db.collection('scraper_progress').deleteOne({ owner, repo, interactionType: type });
        await scrapeGraphQLInteractions(owner, repo, type, db);
      }
    }

    await scrapeContributors(owner, repo, db);
  } catch (error) {
    console.error(`Failed to scrape interactions for ${owner}/${repo}:`, error);
  }
}
