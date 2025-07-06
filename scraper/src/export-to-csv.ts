import * as fs from 'fs';
import { MongoClient } from 'mongodb';
import Papa from 'papaparse';

const mongoClient = new MongoClient(process.env.MONGO_URL || 'mongodb://localhost:27017');

// Define the interaction types
const INTERACTION_TYPES = ['contributor', 'stargazer', 'watcher', 'forker'] as const;
type InteractionType = (typeof INTERACTION_TYPES)[number];

// Repository name to short description lookup
const REPO_DESCRIPTIONS: Record<string, string> = {
  'super-productivity': 'to-do & Pomodoro app',
  blurred: 'macOS dimming/focus app',
  SelfControl: 'macOS site blocker',
  stretchly: 'break reminder app',
  pomotroid: 'visual Pomodoro timer',
  pomatez: 'custom Pomodoro & to-do',
  TomatoBar: 'macOS Pomodoro timer',
  LeechBlockNG: 'site blocker extension',
  pomolectron: 'Electron Pomodoro timer',
  focus: 'CLI Pomodoro timer',
  FocusTide: 'browser Pomodoro app',
  invoiceninja: 'invoicing & time tracking',
  solidtime: 'open-source time tracker',
  kimai: 'web time tracker',
  wakapi: 'WakaTime backend',
  Watson: 'CLI time tracker',
  toggldesktop: 'desktop time tracker',
  timetagger: 'tag-based time tracker',
  timewarrior: 'CLI time tracker',
  server: 'self-hosted time tracker',
  beaverhabits: 'habit tracker',
  Hours: 'work hours tracker',
  timetrace: 'CLI work tracker',
  lotti: 'life tracker app',
  'time-tracker-4-browser': 'time tracking browser extension',
  moro: 'CLI work tracker',
  'browser-wakatime': 'browser time tracker',
  selfcontrol: 'macOS site blocker',
};

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    // Check for missing repository descriptions before processing
    const repoNamesFromDB = new Set(
      users.flatMap((u: any) => u.repositoryInteractions?.map((i: any) => i.repositoryName) || [])
    );

    const describedRepoNames = new Set(Object.keys(REPO_DESCRIPTIONS));
    const missingRepoNames = [...repoNamesFromDB].filter(
      (name) => name && !describedRepoNames.has(name)
    );

    if (missingRepoNames.length > 0) {
      console.error('Missing repository descriptions for the following repos:');
      missingRepoNames.forEach((name) => console.error(`- ${name}`));
    }

    const uniqueContributors = new Map<string, any>();
    for (const user of users) {
      if (
        user.email &&
        !user.email.endsWith('@users.noreply.github.com') &&
        !user.email.endsWith('.private') &&
        EMAIL_REGEX.test(user.email) &&
        !uniqueContributors.has(user.email)
      ) {
        uniqueContributors.set(user.email, user);
      }
    }

    const contributorsForCsv = Array.from(uniqueContributors.values()).map((user: any) => {
      const { _id, repositoryInteractions, ...rest } = user;

      const fullName = rest.name;
      if (rest.name) {
        rest.name = rest.name.split(' ')[0];
      } else {
        rest.name = rest.login;
      }

      let interactionDetails: any = {};
      let actionKeyword = '';
      if (repositoryInteractions && repositoryInteractions.length > 0) {
        const firstInteraction = repositoryInteractions[0];
        interactionDetails = {
          interactionType: firstInteraction.interactionType,
          repositoryName: firstInteraction.repositoryName,
          repositoryOwner: firstInteraction.repositoryOwner,
          contributions: firstInteraction.contributions,
        };
        const repoDesc = REPO_DESCRIPTIONS[firstInteraction.repositoryName];
        let repoLabel = firstInteraction.repositoryName;
        if (repoDesc) repoLabel += ` (${repoDesc})`;
        switch (firstInteraction.interactionType as InteractionType) {
          case 'stargazer':
            actionKeyword = `stargazed ${repoLabel}`;
            break;
          case 'watcher':
            actionKeyword = `watching ${repoLabel}`;
            break;
          case 'forker':
            actionKeyword = `forked ${repoLabel}`;
            break;
          case 'contributor':
            actionKeyword = `contributed to ${repoLabel}`;
            break;
          default:
            actionKeyword = '';
        }
      }

      return { fullName, ...rest, ...interactionDetails, actionKeyword };
    });

    const csv = Papa.unparse(contributorsForCsv);
    fs.writeFileSync('contributors-with-interactions.csv', csv);
    console.log(
      `Successfully exported ${contributorsForCsv.length} contributors to contributors-with-interactions.csv`
    );

    // Export a smaller test version
    if (contributorsForCsv.length > 0) {
      const testCsv = Papa.unparse(contributorsForCsv.slice(0, 10));
      fs.writeFileSync('contributors_with_interactions_test.csv', testCsv);
      console.log(
        'Successfully exported the first 10 contributors to contributors_with_interactions_test.csv'
      );
    }
  } catch (error) {
    console.error('Error exporting contributors to CSV:', error);
  } finally {
    await mongoClient.close();
  }
}

exportContributorsToCsv();
