import { Octokit } from 'octokit';
import { MongoClient } from 'mongodb';
import {
  fetchBasicUserData,
  fetchUserEmailFromEvents,
  fetchXProfileMetadata,
  fetchWatchers,
} from './lib';

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
    const watcherLogins = await fetchWatchers(owner, repo);

    console.log(`Watchers for ${owner}/${repo}:`);

    await mongoClient.connect();
    const db = mongoClient.db('cronus-scraper');
    const collection = db.collection('watchers');

    for (const login of watcherLogins) {
      if (login) {
        console.log(`- ${login}`);
        const userProfile = await scrapeUserProfile(login);
        await collection.updateOne(
          { login: userProfile.login },
          { $set: { ...userProfile, interactionType: 'watcher' } },
          { upsert: true }
        );
      }
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
