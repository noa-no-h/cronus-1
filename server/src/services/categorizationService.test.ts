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
    // Helper function to run LLM categorization tests
    const runLlmCategorizationTest = async ({
      activeWindow,
      mockUser,
      mockCategories,
      expectedCategoryName,
    }: {
      activeWindow: Pick<
        ActiveWindowDetails,
        'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
      >;
      mockUser: any; // Using 'any' for mock user as its structure varies slightly in one test
      mockCategories: any[]; // Using 'any[]' for mock categories as it's a list of mock objects
      expectedCategoryName: string;
    }) => {
      // Arrange: Mock history check to fail, simulating the LLM pathway
      (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      // Arrange: Mock user and categories
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      });
      (CategoryModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCategories),
      });

      // Act
      const result = await categorizeActivity(mockUserId, activeWindow);

      // Assert
      const expectedCategory = mockCategories.find((c) => c.name === expectedCategoryName);
      const receivedCategory = mockCategories.find((c) => c._id === result.categoryId);
      expect(receivedCategory?.name ?? 'Category Not Found').toBe(
        expectedCategory?.name ?? 'Expected Category Not Found'
      );
      expect(ActiveWindowEventModel.findOne).toHaveBeenCalledTimes(1);
      expect(UserModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(CategoryModel.find).toHaveBeenCalledWith({ userId: mockUserId });
    };

    // --- Test Data ---
    const mockUser = {
      userGoals: {
        dailyGoal: 'Scout for dream wife on Instagram etc',
        weeklyGoal: 'Go on a date and finish big work project',
        lifeGoal: 'Find my dream wife and build a successful company',
      },
    };

    const dreamWifeCategory = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: mockUserId,
      name: 'Find Dream Wife',
      description:
        'Look at Instagram profiles for potential dream wives, read about dating content to understand dating dynamics.',
    };
    const socialMediaCategory = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: mockUserId,
      name: 'Social Media Distraction',
      description: 'Mindlessly scrolling social media.',
    };
    const deepWorkCategory = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: mockUserId,
      name: 'Deep Work',
      description: 'Focused coding and development tasks.',
    };
    const shallowWorkCategory = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: mockUserId,
      name: 'Shallow Work',
      description: 'Emails, slack, etc.',
    };

    const dreamWifeSeekingCategories = [dreamWifeCategory, socialMediaCategory, deepWorkCategory];

    // --- Tests ---
    test('should call OpenAI and return a category when no history is found', async () => {
      const activeWindow = {
        ownerName: 'Code',
        title: 'Writing a new feature for an AI assistant',
        url: null,
        content:
          'function newFeature() { console.log("hello world"); } // working on a new feature',
        type: 'window' as const,
        browser: null,
      };

      await runLlmCategorizationTest({
        activeWindow,
        mockUser: {
          userGoals: {
            dailyGoal: 'Finish coding the new feature',
            weeklyGoal: 'Deploy v2',
            lifeGoal: 'Become a great developer',
          },
        },
        mockCategories: [deepWorkCategory, shallowWorkCategory],
        expectedCategoryName: deepWorkCategory.name,
      });
    }, 30000);

    test('should categorize browsing a female Instagram profile as "Find Dream Wife"', async () => {
      const activeWindow = {
        ownerName: 'Google Chrome',
        title: 'Alana Silber (@alanasilber) • Instagram photos and videos',
        url: 'https://www.instagram.com/alanasilber/',
        content: null,
        type: 'browser' as const,
        browser: 'chrome' as const,
      };

      await runLlmCategorizationTest({
        activeWindow,
        mockUser,
        mockCategories: dreamWifeSeekingCategories,
        expectedCategoryName: dreamWifeCategory.name,
      });
    }, 30000);

    test('should categorize browsing a car Instagram profile as "Social Media Distraction"', async () => {
      const activeWindow = {
        ownerName: 'Google Chrome',
        title: 'CarsWithoutLimits (@carswithoutlimits) • Instagram photos and videos',
        url: 'https://www.instagram.com/carswithoutlimits/',
        content: null,
        type: 'browser' as const,
        browser: 'chrome' as const,
      };
      await runLlmCategorizationTest({
        activeWindow,
        mockUser,
        mockCategories: dreamWifeSeekingCategories,
        expectedCategoryName: socialMediaCategory.name,
      });
    }, 30000);

    test('should categorize browsing a dating-related article as "Find Dream Wife" WITH content', async () => {
      const activeWindow = {
        ownerName: 'Google Chrome',
        title: "Tallgirlification: it's over for girlbosses",
        url: 'https://indianbronson.substack.com/p/tallgirlification-its-over-for-girlbosses?utm_source=publication-search',
        content:
          "Thats right. Another one of these posts detailing an idiotic feature of the Sexual Revolution and why its actually a much more important topic than you think. Consider how this stuff gets PhDs published in Bloomberg Opinion— they are wrong in an old-hat way of course—but what was once tawdry and unserious is finally being recognized as quite serious for the West's future societies & economies.",
        type: 'browser' as const,
        browser: 'chrome' as const,
      };
      await runLlmCategorizationTest({
        activeWindow,
        mockUser,
        mockCategories: dreamWifeSeekingCategories,
        expectedCategoryName: dreamWifeCategory.name,
      });
    }, 30000);

    test('should categorize browsing a dating-related article as "Find Dream Wife" WITHOUT content', async () => {
      const activeWindow = {
        ownerName: 'Google Chrome',
        title: "Tallgirlification: it's over for girlbosses",
        url: 'https://indianbronson.substack.com/p/tallgirlification-its-over-for-girlbosses?utm_source=publication-search',
        content: null,
        type: 'browser' as const,
        browser: 'chrome' as const,
      };
      await runLlmCategorizationTest({
        activeWindow,
        mockUser,
        mockCategories: dreamWifeSeekingCategories,
        expectedCategoryName: dreamWifeCategory.name,
      });
    }, 30000);
  });
});
