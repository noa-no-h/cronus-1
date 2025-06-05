import { afterEach, beforeEach, describe, expect, jest, mock, test } from 'bun:test';
import mongoose from 'mongoose';
import { ActiveWindowDetails } from '../../../shared/types';

// Note: These tests perform live OpenAI API calls.
// Ensure OPENAI_API_KEY is set in your environment.

// Mock Mongoose models and their methods
const mockActiveWindowEventModel = {
  findOne: jest.fn(),
};
const mockCategoryModel = {
  findById: jest.fn(),
  find: jest.fn(),
};
const mockUserModel = {
  findById: jest.fn(),
};

// Use mock.module to replace the actual models with our mocks
mock.module('../models/activeWindowEvent', () => ({
  ActiveWindowEventModel: mockActiveWindowEventModel,
}));
mock.module('../models/category', () => ({
  CategoryModel: mockCategoryModel,
}));
mock.module('../models/user', () => ({
  User: mockUserModel,
}));

// Import the service AFTER mocks are set up
const { categorizeActivity } = await import('./categorizationService');
const { ActiveWindowEventModel } = await import('../models/activeWindowEvent');
const { CategoryModel } = await import('../models/category');
const { User: UserModel } = await import('../models/user');

describe('categorizeActivity', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockRecruitingCategoryId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('History Check', () => {
    test('should return category from history for a known browser URL', async () => {
      // Arrange
      const activeWindow: Pick<
        ActiveWindowDetails,
        'ownerName' | 'title' | 'url' | 'type' | 'browser'
      > = {
        ownerName: 'Google Chrome',
        type: 'browser',
        browser: 'chrome',
        title: 'Messaging candidates on LinkedIn Recruiter',
        url: 'https://www.linkedin.com/recruiter/projects',
      };

      const mockPreviousEvent = {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        url: activeWindow.url,
        categoryId: mockRecruitingCategoryId,
      };

      // Set up the mock return values
      (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPreviousEvent),
      });
      (CategoryModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ name: 'Recruiting' }),
      });

      // Act
      const result = await categorizeActivity(mockUserId, activeWindow);

      // Assert
      expect(result.categoryId).toBe(mockRecruitingCategoryId);
      expect(ActiveWindowEventModel.findOne).toHaveBeenCalledTimes(1);
      expect(ActiveWindowEventModel.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
        url: activeWindow.url,
      });

      // Verify that the LLM pathway was not taken
      expect(UserModel.findById).not.toHaveBeenCalled();
    });
  });

  describe('LLM-based Categorization', () => {
    test('should call OpenAI and return a category when no history is found', async () => {
      // Arrange
      const activeWindow: Pick<
        ActiveWindowDetails,
        'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
      > = {
        ownerName: 'Code',
        title: 'Writing a new feature for an AI assistant',
        url: null,
        content:
          'function newFeature() { console.log("hello world"); } // working on a new feature',
        type: 'window',
        browser: null,
      };

      // No history
      (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      // Mock user and categories
      const mockUser = {
        userGoals: {
          dailyGoal: 'Finish coding the new feature',
          weeklyGoal: 'Deploy v2',
          lifeGoal: 'Become a great developer',
        },
      };
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      const mockCodingCategoryId = new mongoose.Types.ObjectId().toString();
      const mockCategories = [
        {
          _id: mockCodingCategoryId,
          userId: mockUserId,
          name: 'Deep Work',
          description: 'Focused coding and development tasks.',
        },
        {
          _id: new mongoose.Types.ObjectId().toString(),
          userId: mockUserId,
          name: 'Shallow Work',
          description: 'Emails, slack, etc.',
        },
      ];
      (CategoryModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCategories),
      });

      // Act
      const result = await categorizeActivity(mockUserId, activeWindow);

      // Assert
      expect(result.categoryId).not.toBeNull();
      expect(typeof result.categoryId).toBe('string');
      expect(ActiveWindowEventModel.findOne).toHaveBeenCalledTimes(1);
      expect(UserModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(CategoryModel.find).toHaveBeenCalledWith({ userId: mockUserId });
    }, 30000); // live api timeout
  });
});
