import * as fs from 'fs';
import { MongoClient } from 'mongodb';
import Papa from 'papaparse';

const mongoClient = new MongoClient(
  process.env.MONGO_URL || 'mongodb://localhost:27017/cronus-scraper'
);

async function exportContributorsToCsv() {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('scraper');
    const collection = db.collection('contributors');
    const contributors = await collection.find({}).toArray();

    if (contributors.length === 0) {
      console.log('No contributors found in the database to export.');
      return;
    }

    console.log(`Found ${contributors.length} contributors to export.`);

    // The _id field from mongo is not useful in the csv
    const contributorsWithoutId = contributors.map((c) => {
      const { _id, ...rest } = c;
      return rest;
    });

    const csv = Papa.unparse(contributorsWithoutId);
    fs.writeFileSync('contributors.csv', csv);
    console.log('Successfully exported contributors to contributors.csv');
  } catch (error) {
    console.error('Error exporting contributors to CSV:', error);
  } finally {
    await mongoClient.close();
  }
}

exportContributorsToCsv();
