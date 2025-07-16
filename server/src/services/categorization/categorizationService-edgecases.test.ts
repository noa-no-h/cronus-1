import { afterEach, beforeEach, describe, expect, jest, mock, test } from 'bun:test';
import mongoose from 'mongoose';
import { ActiveWindowDetails } from '../../../../shared/types';

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

mock.module('../../models/activeWindowEvent', () => ({
  ActiveWindowEventModel: mockActiveWindowEventModel,
}));
mock.module('../../models/category', () => ({
  CategoryModel: mockCategoryModel,
}));
mock.module('../../models/user', () => ({
  UserModel: mockUserModel,
}));

const { categorizeActivity } = await import('./categorizationService');
const { ActiveWindowEventModel } = await import('../../models/activeWindowEvent');
const { CategoryModel } = await import('../../models/category');
const { UserModel } = await import('../../models/user');

describe('categorizeActivity edge cases', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should categorize viewing a stock portfolio as Distraction if no Investing category exists', async () => {
    // Arrange: Mock history check to fail, simulating the LLM pathway
    (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    // Template categories (copied from CategoryTemplateList.tsx) + Distraction
    const templateCategories = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Contracting for XYZ',
        description:
          'Working on a project for Contractor work for XYZ including meetings, emails, etc. related to that project',
        color: '#22C55E',
        isProductive: true,
        isDefault: false,
        isLikelyToBeOffline: false,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Coding',
        description: 'Writing or reviewing code, debugging, working in IDEs or terminals',
        color: '#3B82F6',
        isProductive: true,
        isDefault: false,
        isLikelyToBeOffline: false,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Design',
        description: 'Working in design tools like Figma or Illustrator on UX/UI or visual assets',
        color: '#8B5CF6',
        isProductive: true,
        isDefault: false,
        isLikelyToBeOffline: false,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Product Management',
        description: 'Planning features, writing specs, managing tickets, reviewing user feedback',
        color: '#10B981',
        isProductive: true,
        isDefault: false,
        isLikelyToBeOffline: false,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Growth & Marketing',
        description: 'Working on campaigns, analytics, user acquisition, SEO or outreach',
        color: '#EAB308',
        isProductive: true,
        isDefault: false,
        isLikelyToBeOffline: false,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Work Communication',
        description: 'Responding to emails, Slack, Notion, meetings or async updates',
        color: '#0EA5E9',
        isProductive: true,
        isDefault: false,
        isLikelyToBeOffline: false,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Distraction',
        description: 'Scrolling social media, browsing unrelated content, or idle clicking',
        color: '#EC4899',
        isProductive: false,
        isDefault: false,
        isLikelyToBeOffline: false,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Dating',
        description: 'Using dating apps, messaging, browsing profiles, or going on dates',
        color: '#F43F5E',
        isProductive: false,
        isDefault: false,
        isLikelyToBeOffline: true,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Eating & Shopping',
        description: 'Eating meals, cooking, groceries, or online/in-person shopping',
        color: '#D97706',
        isProductive: false,
        isDefault: false,
        isLikelyToBeOffline: true,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Sport & Health',
        description: 'Exercising, walking, gym, sports, wellness, etc.',
        color: '#6366F1',
        isProductive: true,
        isDefault: false,
        isLikelyToBeOffline: true,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Friends & Social',
        description: 'Spending time with friends or socializing in person or online',
        color: '#A855F7',
        isProductive: false,
        isDefault: false,
        isLikelyToBeOffline: true,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Planning & Reflection',
        description: 'Journaling, reflecting on goals, or reviewing personal plans',
        color: '#84CC16',
        isProductive: true,
        isDefault: false,
        isLikelyToBeOffline: false,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Commuting',
        description: 'Traveling to or from work, errands, or social events',
        color: '#6B7280',
        isProductive: false,
        isDefault: false,
        isLikelyToBeOffline: true,
      },
    ];

    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        userProjectsAndGoals:
          "I'm working on Cronus - The ai time/distraction tracker software. I'm working on improving the app and getting the first few 1000 users. Might include going on reddit or X to post but most likely any x visit is a distraction.",
      }),
    });
    (CategoryModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(templateCategories),
    });

    const ocrContent = `• public\nQ Search assets\nMarket closed & July 15\nSummary v\nSPY $621.04 * 0.60%\nQQQ $555.78 N 0.08%\nVXX $45.81 * 0.13%\nBitcoin $117,516.97 > 3.19%\nUST 6M —\n$38,026.42\n• -$562.40 (-1.46%) today ®\nReturn\nAllocation\nIncome\nAccount value\n1M\n3M\nAM\nYTD\nAll\nPortfolio\nAll\nOptions\nEquities\nEquities\nSANA\nCana Riotechnolodv\nLIDED\nUber\nCrunto\nRitcoin\nCrypto\nBonds\nCrypto\nPrice\n$4.20\n-$0.02 (-0.47%)\n¢01 01\n-$1.98 (-2.11%)\n$117,515.69\n+$33.77 (+0.03%)\nHoldings\n$39,907.13\n0501 60702 chares\n$919.10\n10 shares\nCost\n$32,472.09\n42 42/chare\n$906.29\n$90.63/share\n$15,890.50\n0.13522022 BTC\nopted by Bays co\n$16,228.26\nPoritolle\nInvest v\nMargin buying power $3,662.41 v\nBrokerage =\nUpdates\nMargin call warning\nYour account was recently within 10% of vour\nmargin maintenance requirement.\nResolve\nComplete your options account\nnahle antions tradina to lock in vour trading\nrebate, plus unlock dozens of educational videos\nand articles.\nFinish enabling\nPublic Premium is almost yours\nAccess in-depth analysis, enhanced trading\nfeatures. and VIP customer service\nUpgrade now\n< 1 of 4 >\nCustomize o\n1D return\n-0.47%\n-$190.03\n-2.11%\n- $19.80\nUnrealized return\n+37.80%\n+1.41%\n+$12.81\n+0.03%\n1e4C7\n-2.08%\n-$337.76`;

    const activeWindow: Pick<
      ActiveWindowDetails,
      'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
    > = {
      ownerName: 'Portfolio',
      title: 'Portfolio - Public.com',
      url: 'https://public.com/portfolio',
      content: ocrContent,
      type: 'browser', // changed from 'website' to 'browser' to match allowed types
      browser: null,
    };

    // Act
    const result = await categorizeActivity(mockUserId, activeWindow);

    // Assert
    const distractionCategory = templateCategories.find((c) => c.name === 'Distraction');
    const receivedCategory = templateCategories.find((c) => c._id === result.categoryId);
    expect(receivedCategory?.name ?? 'Category Not Found').toBe(
      distractionCategory?.name ?? 'Expected Category Not Found'
    );
    expect(ActiveWindowEventModel.findOne).toHaveBeenCalledTimes(1);
    expect(UserModel.findById).toHaveBeenCalledWith(mockUserId);
    expect(CategoryModel.find).toHaveBeenCalledWith({
      userId: mockUserId,
      isArchived: { $ne: true },
    });
  });
});
