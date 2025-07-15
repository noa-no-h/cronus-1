import { afterEach, beforeEach, describe, expect, jest, mock, test } from 'bun:test';
import mongoose from 'mongoose';
import { defaultCategoriesData } from 'shared/categories';

// Mock Mongoose models
let mockDb: any[] = [];

const mockCategoryModel = {
  find: jest.fn((query) => {
    const isDefault = query.isDefault;
    let results = mockDb;
    if (query.userId) {
      results = mockDb.filter((cat) => cat.userId === query.userId);
    }
    if (query.isDefault !== undefined) {
      results = results.filter((cat) => cat.isDefault === query.isDefault);
    }
    // Simulate Mongoose documents, which have a toJSON method
    return Promise.resolve(results.map((r) => ({ ...r, toJSON: () => r })));
  }),
  deleteMany: jest.fn((query) => {
    mockDb = mockDb.filter((cat) => cat.isDefault === true || cat.userId !== query.userId);
    return Promise.resolve();
  }),
  insertMany: jest.fn((categories) => {
    mockDb.push(...categories);
    // insertMany doesn't return documents with toJSON, but it's find that matters
    return Promise.resolve(categories);
  }),
  // Add a toJSON method to items for the final mapping step in the service
  // This helps simulate the Mongoose document behavior
  // Note: This is a simplified simulation
  toJSON: (item: any) => () => item,
};

mock.module('../../models/category', () => ({
  CategoryModel: mockCategoryModel,
}));

// Import the service AFTER mocks are set up
const { resetCategoriesToDefault } = await import('./categoryResettingService');

describe('resetCategoriesToDefault', () => {
  const userId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    mockDb = [];
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should restore default categories if none exist', async () => {
    const result = await resetCategoriesToDefault(userId);

    expect(mockCategoryModel.deleteMany).toHaveBeenCalledWith({ userId, isDefault: { $ne: true } });
    expect(mockCategoryModel.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Work' }),
        expect.objectContaining({ name: 'Distraction' }),
      ])
    );
    expect(result).toHaveLength(2);
    expect(result.some((c) => c.name === 'Work')).toBe(true);
  });

  test('should delete non-default categories and keep default ones', async () => {
    // Setup: Create default and custom categories
    mockDb = [
      ...defaultCategoriesData(userId),
      {
        userId,
        name: 'Custom Category',
        color: '#111111',
        isProductive: true,
        isDefault: false,
      },
    ];

    const result = await resetCategoriesToDefault(userId);

    expect(mockCategoryModel.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockCategoryModel.insertMany).not.toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result.find((c) => c.name === 'Custom Category')).toBeUndefined();
  });

  test('should not add new default categories if they exist (even if renamed)', async () => {
    const defaults = defaultCategoriesData(userId);
    const workCategory = { ...defaults.find((d) => d.isProductive)!, name: 'Productive Time' };
    const distractionCategory = {
      ...defaults.find((d) => !d.isProductive)!,
      name: 'Unproductive Time',
    };
    mockDb = [workCategory, distractionCategory];

    const result = await resetCategoriesToDefault(userId);

    expect(mockCategoryModel.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockCategoryModel.insertMany).not.toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result.some((c) => c.name === 'Productive Time')).toBe(true);
  });

  test('should add a missing default category if one was deleted', async () => {
    const defaults = defaultCategoriesData(userId);
    mockDb = [defaults.find((d) => d.isProductive)!]; // Only one default

    const result = await resetCategoriesToDefault(userId);

    expect(mockCategoryModel.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockCategoryModel.insertMany).toHaveBeenCalledTimes(1);
    expect(mockCategoryModel.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'Distraction' })])
    );
    expect(result).toHaveLength(2);
    expect(result.some((c) => c.name === 'Distraction')).toBe(true);
  });
});
