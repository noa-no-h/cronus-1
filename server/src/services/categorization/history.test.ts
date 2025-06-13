import { afterEach, beforeEach, describe, expect, jest, mock, test } from 'bun:test';
import mongoose from 'mongoose';
import { ActiveWindowDetails } from '../../../../shared/types';
import { checkActivityHistory } from './history';

// Mock Mongoose models and their methods
const mockActiveWindowEventModel = {
  findOne: jest.fn(),
};

// Use mock.module to replace the actual models with our mocks
mock.module('../../models/activeWindowEvent', () => ({
  ActiveWindowEventModel: mockActiveWindowEventModel,
}));
const { ActiveWindowEventModel } = await import('../../models/activeWindowEvent');

describe('checkActivityHistory', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockRecruitingCategoryId = new mongoose.Types.ObjectId().toString();
  const mockWorkCategoryId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return category from history for a known browser URL', async () => {
    // Arrange
    const activeWindow: Pick<ActiveWindowDetails, 'ownerName' | 'title' | 'url' | 'type'> = {
      ownerName: 'Google Chrome',
      type: 'browser',
      title: 'Messaging candidates on LinkedIn Recruiter',
      url: 'https://www.linkedin.com/recruiter/projects',
    };

    const mockPreviousEvent = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: mockUserId,
      url: activeWindow.url,
      categoryId: mockRecruitingCategoryId,
    };

    (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockPreviousEvent),
    });

    // Act
    const result = await checkActivityHistory(mockUserId, activeWindow);

    // Assert
    expect(result).toBe(mockRecruitingCategoryId);
    expect(ActiveWindowEventModel.findOne).toHaveBeenCalledTimes(1);
    expect(ActiveWindowEventModel.findOne).toHaveBeenCalledWith({
      userId: mockUserId,
      url: activeWindow.url,
    });
  });

  test('should return category from history for a Cursor project', async () => {
    // Arrange
    const activeWindow: Pick<ActiveWindowDetails, 'ownerName' | 'title' | 'url' | 'type'> = {
      ownerName: 'Cursor',
      type: 'window',
      title: 'billingPlan.ts — spellbound',
      url: null,
    };

    const mockPreviousEvent = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: mockUserId,
      ownerName: 'Cursor',
      title: 'someOtherFile.ts — spellbound',
      categoryId: mockWorkCategoryId,
    };

    (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockPreviousEvent),
    });

    // Act
    const result = await checkActivityHistory(mockUserId, activeWindow);

    // Assert
    expect(result).toBe(mockWorkCategoryId);
    expect(ActiveWindowEventModel.findOne).toHaveBeenCalledTimes(1);
    expect(ActiveWindowEventModel.findOne).toHaveBeenCalledWith({
      userId: mockUserId,
      ownerName: 'Cursor',
      title: { $regex: '— spellbound$', $options: 'i' },
    });
  });

  test('should return category from history for a VSCode project with complex title', async () => {
    // Arrange
    const activeWindow: Pick<ActiveWindowDetails, 'ownerName' | 'title' | 'url' | 'type'> = {
      ownerName: 'Code',
      type: 'window',
      title: 'appFilter.mm (Working Tree) (appFilter.mm) — whatdidyougetdonethisweek-ai',
      url: null,
    };

    const mockPreviousEvent = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: mockUserId,
      ownerName: 'Code',
      title: 'someOtherFile.js — whatdidyougetdonethisweek-ai',
      categoryId: mockWorkCategoryId,
    };

    (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockPreviousEvent),
    });

    // Act
    const result = await checkActivityHistory(mockUserId, activeWindow);

    // Assert
    expect(result).toBe(mockWorkCategoryId);
    expect(ActiveWindowEventModel.findOne).toHaveBeenCalledTimes(1);
    expect(ActiveWindowEventModel.findOne).toHaveBeenCalledWith({
      userId: mockUserId,
      ownerName: 'Code',
      title: { $regex: '— whatdidyougetdonethisweek-ai$', $options: 'i' },
    });
  });

  test('should fallback to ownerName for editor if title has no project', async () => {
    // Arrange
    const activeWindow: Pick<ActiveWindowDetails, 'ownerName' | 'title' | 'url' | 'type'> = {
      ownerName: 'Cursor',
      type: 'window',
      title: 'Cursor Home', // No "—" separator
      url: null,
    };

    const mockPreviousEvent = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: mockUserId,
      ownerName: 'Cursor',
      categoryId: mockWorkCategoryId,
    };

    (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockPreviousEvent),
    });

    // Act
    await checkActivityHistory(mockUserId, activeWindow);

    // Assert
    expect(ActiveWindowEventModel.findOne).toHaveBeenCalledWith({
      userId: mockUserId,
      ownerName: 'Cursor',
    });
  });
});
