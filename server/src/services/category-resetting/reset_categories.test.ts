import { afterAll, afterEach, beforeAll, describe, expect, test } from '@jest/globals';
import mongoose from 'mongoose';
import { defaultCategoriesData } from 'shared/categories';
import { CategoryModel } from '../../models/category';
import { resetCategoriesToDefault } from './categoryResettingService';

// Connect to a test database
beforeAll(async () => {
  const url = `mongodb://127.0.0.1/test-db-reset-categories`;
  await mongoose.connect(url);
});

// Clear the database after each test
afterEach(async () => {
  await CategoryModel.deleteMany({});
});

// Close the database connection after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('resetCategoriesToDefault', () => {
  const userId = new mongoose.Types.ObjectId().toString();

  test('should restore default categories if none exist', async () => {
    const result = await resetCategoriesToDefault(userId);
    expect(result).toHaveLength(2);
    expect(result.some((c) => c.name === 'Work')).toBe(true);
    expect(result.some((c) => c.name === 'Distraction')).toBe(true);
  });

  test('should delete non-default categories and keep default ones', async () => {
    // Setup: Create default and custom categories
    await CategoryModel.insertMany(defaultCategoriesData(userId));
    await CategoryModel.create({
      userId,
      name: 'Custom Category',
      color: '#111111',
      isProductive: true,
      isDefault: false,
    });

    let categories = await CategoryModel.find({ userId });
    expect(categories).toHaveLength(3);

    const result = await resetCategoriesToDefault(userId);
    expect(result).toHaveLength(2);
    expect(result.find((c) => c.name === 'Custom Category')).toBeUndefined();
  });

  test('should not add new default categories if they exist (even if renamed)', async () => {
    // Setup: Create renamed default categories
    const defaults = defaultCategoriesData(userId);
    const workCategory = defaults.find((d) => d.isProductive);
    const distractionCategory = defaults.find((d) => !d.isProductive);

    await CategoryModel.create({ ...workCategory, name: 'Productive Time' });
    await CategoryModel.create({ ...distractionCategory, name: 'Unproductive Time' });

    let categories = await CategoryModel.find({ userId });
    expect(categories).toHaveLength(2);

    const result = await resetCategoriesToDefault(userId);
    expect(result).toHaveLength(2);
    expect(result.some((c) => c.name === 'Productive Time')).toBe(true);
    expect(result.some((c) => c.name === 'Unproductive Time')).toBe(true);
    expect(result.some((c) => c.name === 'Work')).toBe(false);
  });

  test('should add a missing default category if one was deleted', async () => {
    // Setup: one default category
    const defaults = defaultCategoriesData(userId);
    const workCategory = defaults.find((d) => d.isProductive);
    await CategoryModel.create(workCategory);

    let categories = await CategoryModel.find({ userId });
    expect(categories).toHaveLength(1);

    const result = await resetCategoriesToDefault(userId);
    expect(result).toHaveLength(2);
    expect(result.some((c) => c.name === 'Work')).toBe(true);
    expect(result.some((c) => c.name === 'Distraction')).toBe(true);
  });
});
