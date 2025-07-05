import * as fs from 'fs';
import { MongoClient } from 'mongodb';
import Papa from 'papaparse';

const mongoClient = new MongoClient(process.env.MONGO_URL || 'mongodb://localhost:27017');

async function exportContributorsToCsv() {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('cronus-scraper');
    const collection = db.collection('users');
    const users = await collection.find({}).toArray();

    if (users.length === 0) {
      console.log('No users found in the database to export.');
      return;
    }

    console.log(`Found ${users.length} contributors to export.`);

    const contributorsForCsv = users.map((user: any) => {
      const { _id, repositoryInteractions, ...rest } = user;

      if (rest.email && rest.email.endsWith('@users.noreply.github.com')) {
        rest.email = '';
      }

      const fullName = rest.name;

      if (rest.name) {
        rest.name = rest.name.split(' ')[0];
      } else {
        rest.name = rest.login;
      }

      let interactionDetails: any = {};
      if (repositoryInteractions && repositoryInteractions.length > 0) {
        const firstInteraction = repositoryInteractions[0];
        interactionDetails = {
          interactionType: firstInteraction.interactionType,
          repositoryName: firstInteraction.repositoryName,
          repositoryOwner: firstInteraction.repositoryOwner,
          contributions: firstInteraction.contributions,
        };
      }

      return { fullName, ...rest, ...interactionDetails };
    });

    const usersWithEmail = contributorsForCsv.filter((c) => c.email);
    console.log(`Found ${usersWithEmail.length} users with a valid email address.`);

    const usersWithTwitter = contributorsForCsv.filter((c) => c.twitter_username);
    console.log(`Found ${usersWithTwitter.length} users with a Twitter/X username.`);

    const csv = Papa.unparse(contributorsForCsv);
    fs.writeFileSync('contributors-with-interactions.csv', csv);
    console.log('Successfully exported contributors to contributors-with-interactions.csv');
  } catch (error) {
    console.error('Error exporting contributors to CSV:', error);
  } finally {
    await mongoClient.close();
  }
}

exportContributorsToCsv();
