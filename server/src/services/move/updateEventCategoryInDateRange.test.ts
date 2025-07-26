import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ActiveWindowEventModel } from '../../models/activeWindowEvent';
import { updateEventCategoryInDateRange } from './updateEventCategoryInDateRange';

let mongoServer: MongoMemoryServer;

describe('updateEventCategoryInDateRange', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await ActiveWindowEventModel.deleteMany({});
  });

  afterEach(async () => {
    await ActiveWindowEventModel.deleteMany({});
  });

  it('should move all events with the exact same URL in the date range, regardless of title', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const url = 'https://chatgpt.com/c/6881c678-66f8-8321-90a5-5e4d5ad93aad';
    const oldCategoryId = new mongoose.Types.ObjectId().toString();
    const newCategoryId = new mongoose.Types.ObjectId().toString();
    const startDate = new Date('2025-07-24T00:00:00.000Z');
    const endDate = new Date('2025-07-24T23:59:59.999Z');

    // Insert two events with the same URL but different titles
    await ActiveWindowEventModel.create([
      {
        userId,
        ownerName: 'Google Chrome',
        type: 'browser',
        title: 'Are you gay?',
        url,
        categoryId: oldCategoryId,
        timestamp: new Date('2025-07-24T06:02:59.119Z'),
      },
      {
        userId,
        ownerName: 'Google Chrome',
        type: 'browser',
        title: 'ChatGPT',
        url,
        categoryId: oldCategoryId,
        timestamp: new Date('2025-07-24T06:03:59.119Z'),
      },
    ]);

    // Call the move service
    await updateEventCategoryInDateRange({
      userId,
      startDateMs: startDate.getTime(),
      endDateMs: endDate.getTime(),
      activityIdentifier: url,
      itemType: 'website',
      newCategoryId,
    });

    // Assert both events have the new category
    const updatedEvents = await ActiveWindowEventModel.find({ userId, url });
    expect(updatedEvents).toHaveLength(2);
    updatedEvents.forEach((event) => {
      expect(event.categoryId!.toString()).toBe(newCategoryId);
    });
  });

  it('should move all events with the same title in the date range when URL is missing', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const title = 'Special Project';
    const ownerName = 'Google Chrome';
    const oldCategoryId = new mongoose.Types.ObjectId().toString();
    const newCategoryId = new mongoose.Types.ObjectId().toString();
    const startDate = new Date('2025-07-25T00:00:00.000Z');
    const endDate = new Date('2025-07-25T23:59:59.999Z');

    // Insert events to test the scenario
    await ActiveWindowEventModel.create([
      // Event 1: Should be moved (null url)
      {
        userId,
        ownerName,
        type: 'browser',
        title,
        url: null,
        categoryId: oldCategoryId,
        timestamp: new Date('2025-07-25T10:00:00.000Z'),
      },
      // Event 2: Should be moved (empty url)
      {
        userId,
        ownerName,
        type: 'browser',
        title,
        url: '',
        categoryId: oldCategoryId,
        timestamp: new Date('2025-07-25T11:00:00.000Z'),
      },
      // Event 3: Should NOT be moved (different ownerName)
      {
        userId,
        ownerName: 'Safari',
        type: 'browser',
        title,
        url: null,
        categoryId: oldCategoryId,
        timestamp: new Date('2025-07-25T12:00:00.000Z'),
      },
      // Event 4: Should NOT be moved (different title)
      {
        userId,
        ownerName,
        type: 'browser',
        title: 'Another Project',
        url: null,
        categoryId: oldCategoryId,
        timestamp: new Date('2025-07-25T13:00:00.000Z'),
      },
    ]);

    // Call the move service, identifying by title
    await updateEventCategoryInDateRange({
      userId,
      startDateMs: startDate.getTime(),
      endDateMs: endDate.getTime(),
      activityIdentifier: title,
      itemType: 'website', // Still 'website' type, but logic will check for url
      newCategoryId,
    });

    // Assert that only the correct events were moved
    const movedEvents = await ActiveWindowEventModel.find({ categoryId: newCategoryId });
    const notMovedEvents = await ActiveWindowEventModel.find({ categoryId: oldCategoryId });

    expect(movedEvents).toHaveLength(2);
    movedEvents.forEach((event) => {
      expect(event.title).toBe(title);
      expect(event.ownerName).toBe(ownerName);
    });

    expect(notMovedEvents).toHaveLength(2);
  });
});
