import { MongoClient } from 'mongodb';
import { Octokit } from 'octokit';
import { fetchBasicUserData, fetchUserEmailFromEvents, fetchXProfileMetadata } from './lib';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const mongoClient = new MongoClient(process.env.MONGO_URL || 'mongodb://localhost:27017');

async function scrapeUserProfile(username: string) {
  console.log(`Scraping profile for ${username}...`);
  const basicInfo = await fetchBasicUserData(octokit, username);
  const emailFromEvents = await fetchUserEmailFromEvents(username, octokit);

  let xProfile = null;
  if (basicInfo.twitter_username) {
    xProfile = await fetchXProfileMetadata(basicInfo.twitter_username);
  }

  const userProfile = {
    ...basicInfo,
    email: basicInfo.email || emailFromEvents,
    xUrl: xProfile ? `https://x.com/${basicInfo.twitter_username}` : null,
    xBio: xProfile?.bio || null,
    xName: xProfile?.name || null,
    xLocation: xProfile?.location || null,
  };

  return userProfile;
}

async function getWatchers(owner: string, repo: string) {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('cronus-scraper');
    const collection = db.collection('watchers');

    const query = /* GraphQL */ `
      query GetWatchers($owner: String!, $repo: String!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          watchers(first: 100, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              login
            }
          }
        }
      }
    `;

    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
      const result: any = await octokit.graphql(query, {
        owner,
        repo,
        cursor,
      });

      const watchers = result.repository.watchers;
      for (const node of watchers.nodes) {
        if (node && node.login) {
          console.log(`- ${node.login}`);
          const userProfile = await scrapeUserProfile(node.login);
          await collection.updateOne(
            { login: userProfile.login },
            { $set: { ...userProfile, interactionType: 'watcher' } },
            { upsert: true }
          );
        }
      }

      hasNextPage = watchers.pageInfo.hasNextPage;
      cursor = watchers.pageInfo.endCursor;
    }
  } catch (error) {
    console.error(`Error fetching watchers:`, error);
  } finally {
    await mongoClient.close();
  }
}

// Example usage:
const owner = 'ActivityWatch';
const repo = 'activitywatch';

console.log(`Fetching watchers for ${owner}/${repo}...`);

getWatchers(owner, repo);
