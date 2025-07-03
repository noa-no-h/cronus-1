import { MongoClient } from 'mongodb';
import { Octokit } from 'octokit';
import { fetchBasicUserData, fetchUserEmailFromEvents, fetchXProfileMetadata } from './lib';

// You can create a personal access token on GitHub to make authenticated requests.
// https://github.com/settings/tokens
// If you don't provide a token, you'll be making unauthenticated requests,
// which have a lower rate limit.
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

async function getContributors(owner: string, repo: string) {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('cronus-scraper');
    const collection = db.collection('contributors');

    const contributors = await octokit.paginate(octokit.rest.repos.listContributors, {
      owner,
      repo,
      per_page: 100,
    });

    for (const contributor of contributors) {
      if (contributor && contributor.login) {
        console.log(`- ${contributor.login} (${contributor.contributions} contributions)`);
        const userProfile = await scrapeUserProfile(contributor.login);
        await collection.updateOne(
          { login: userProfile.login },
          {
            $set: {
              ...userProfile,
              contributions: contributor.contributions,
              interactionType: 'contributor',
            },
          },
          { upsert: true }
        );
      }
    }
  } catch (error) {
    console.error(`Error fetching contributors:`, error);
  } finally {
    await mongoClient.close();
  }
}

// Example usage:
const owner = 'ActivityWatch';
const repo = 'activitywatch';

console.log(`Fetching contributors for ${owner}/${repo}...`);

getContributors(owner, repo);
