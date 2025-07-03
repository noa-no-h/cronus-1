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

async function getStargazers(owner: string, repo: string) {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('cronus-scraper');
    const collection = db.collection('stargazers');

    const stargazers = await octokit.paginate(octokit.rest.repos.listStargazers, {
      owner,
      repo,
      per_page: 100,
    });

    for (const stargazer of stargazers) {
      if (stargazer && stargazer.login) {
        console.log(`- ${stargazer.login}`);
        const userProfile = await scrapeUserProfile(stargazer.login);
        await collection.updateOne(
          { login: userProfile.login },
          { $set: { ...userProfile, interactionType: 'stargazer' } },
          { upsert: true }
        );
      }
    }
  } catch (error) {
    console.error(`Error fetching stargazers:`, error);
  } finally {
    await mongoClient.close();
  }
}

// Example usage:
const owner = 'ActivityWatch';
const repo = 'activitywatch';

console.log(`Fetching stargazers for ${owner}/${repo}...`);

getStargazers(owner, repo);
