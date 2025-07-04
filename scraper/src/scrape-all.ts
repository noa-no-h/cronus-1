import { MongoClient } from 'mongodb';
import { scrapeAllInteractionsForRepo } from './github-scraper';
import * as fs from 'fs';
import * as path from 'path';
import { scaperDBName } from './lib';

const mongoClient = new MongoClient(process.env.MONGO_URL || 'mongodb://localhost:27017');

async function main() {
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB');
    const db = mongoClient.db(scaperDBName);

    const reposFilePath = path.join(__dirname, 'repos-to-scrape.txt');
    const repoUrls = fs.readFileSync(reposFilePath, 'utf-8').split('\n').filter(Boolean);

    for (const url of repoUrls) {
      try {
        const urlParts = url.split('/');
        const owner = urlParts[urlParts.length - 2];
        const repo = urlParts[urlParts.length - 1];

        if (!owner || !repo) {
          console.warn(`Skipping invalid URL: ${url}`);
          continue;
        }

        console.log(`Scraping all interactions for ${owner}/${repo}...`);
        await scrapeAllInteractionsForRepo(owner, repo, db);

        console.log(`Finished scraping for ${owner}/${repo}. Calculating totals from DB...`);

        const usersCollection = db.collection('users');
        const interactionTypes: ['stargazer', 'watcher', 'forker', 'contributor'] = [
          'stargazer',
          'watcher',
          'forker',
          'contributor',
        ];

        const summary: { [key: string]: number } = {};
        for (const type of interactionTypes) {
          summary[type] = await usersCollection.countDocuments({
            repositoryInteractions: {
              $elemMatch: {
                repositoryOwner: owner,
                repositoryName: repo,
                interactionType: type,
              },
            },
          });
        }

        console.log(
          `DB totals for ${owner}/${repo}: ${Object.entries(summary)
            .map(([type, count]) => `${type}s: ${count}`)
            .join(', ')}`
        );
      } catch (error) {
        console.error(`Failed to process interactions for ${url}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
  } finally {
    await mongoClient.close();
    console.log('Disconnected from MongoDB');
  }
}

main();
